import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { MessageProcessor } from '../processor/message.processor';
import { LoggerService } from '../../../common/logger/logger.service';
import { Message } from '../../../modules/messages/entities/message.entity';
import { Status } from '../../../common/enums/Status.enum';
import { Conversation } from '../../../modules/conversations/entities/conversation.entity';
import { Client } from '../../../modules/clients/entities/client.entity';
import { Document } from '../../../common/enums/Document.enum';
import { Plan } from '../../../common/enums/Plan.enum';
import { Role } from '../../../common/enums/Role.enum';
import { Priority } from '../../../common/enums/Priority.enum';

describe('MessageProcessor', () => {
  let processor: MessageProcessor;
  let mockMessageRepository: Repository<Message>;
  let mockLoggerService: LoggerService;

  const mockDataClient: Client = {
    id: 'b2c3d4e5f6a7b8c9d0e1f2a3',
    name: 'Ciclano de Souza',
    documentId: '00987654321',
    documentType: Document.CPF,
    planType: Plan.POSTPAID,
    balance: 50.0,
    limit: 200.0,
    role: Role.USER,
    createDateTime: new Date('2024-02-01T11:00:00Z'),
    lastChangedDateTime: new Date('2024-02-01T11:00:00Z'),
    debit: jest.fn(),
    active: true,
  };

  const mockDataConversation: Conversation = {
    id: 'conv-123',
    clientId: mockDataClient.id,
    client: mockDataClient,
    recipientId: 'rec-456',
    recipient: {
      ...mockDataClient,
      id: 'rec-456',
      name: 'Nome do Destinatário',
      debit: jest.fn(),
    },
    recipientName: 'Nome do Destinatário',
    lastMessageContent: 'Olá!',
    lastMessageTime: new Date('2024-05-20T14:30:00Z'),
    unreadCount: 2,
    createDateTime: new Date('2024-05-20T14:00:00Z'),
    lastChangedDateTime: new Date('2024-05-20T14:30:00Z'),
    messages: [],
    active: true,
  };

  // Mock de uma mensagem
  const mockMessage: Message = {
    id: 'message-id-1',
    conversationId: mockDataConversation.id,
    conversation: mockDataConversation,
    content: 'Teste',
    createDateTime: new Date(),
    lastChangedDateTime: new Date(),
    recipient: mockDataClient,
    sender: mockDataClient,
    senderId: mockDataClient.id,
    status: Status.DELIVERED,
    active: true,
    cost: 0.25,
    priority: Priority.NORMAL,
    recipientId: mockDataClient.id,
    timestamp: new Date(),
  };

  // Mock de um job BullMQ
  const mockJob: Job = {
    id: 'msg123',
    data: { id: 'msg123' /* outros dados da mensagem */ },
    name: 'nome-do-job',
    queueName: 'queue',
    // Outras propriedades do Job podem ser adicionadas se forem usadas
  } as Job<any, any, string>; // Casting para simplificar o mock

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageProcessor,
        {
          provide: LoggerService,
          useValue: {
            setContext: jest.fn(),
            log: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Message),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<MessageProcessor>(MessageProcessor);
    mockMessageRepository = module.get<Repository<Message>>(
      getRepositoryToken(Message),
    );
    mockLoggerService = module.get<LoggerService>(LoggerService);

    // Limpar os mocks antes de cada teste
    jest.clearAllMocks();
    jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((fn: any) => fn() as any); // Mock setTimeout para acelerar testes
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restaura setTimeout
  });

  it('deve ser definido', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('deve processar uma mensagem com sucesso e atualizar seu status para ENTREGUE', async () => {
      // Mock para o cenário de sucesso
      jest
        .spyOn(mockMessageRepository, 'findOne')
        .mockResolvedValue(mockMessage);
      jest
        .spyOn(mockMessageRepository, 'save')
        .mockImplementation((message) => Promise.resolve(message as Message));

      const result = await processor.process(mockJob);

      // Verifica as chamadas ao repositório
      expect(mockMessageRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockJob.data.id },
      });

      // Verifica os logs
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        `Processando job da fila ${mockJob.queueName} com ID ${mockJob.id}`,
      );

      // Verifica o resultado retornado
      expect(result).toEqual({ status: 'success', messageId: mockJob.data.id });
    });

    it('deve lançar NotFoundException e logar um erro se a mensagem não for encontrada', async () => {
      // Mock para o cenário de mensagem não encontrada
      jest.spyOn(mockMessageRepository, 'findOne').mockReturnValue(null!);

      await expect(processor.process(mockJob)).rejects.toThrow(
        NotFoundException,
      );
      await expect(processor.process(mockJob)).rejects.toThrow(
        'Não foi possível encontrar a mensagem',
      );

      // Verifica que o findOne foi chamado
      expect(mockMessageRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockJob.data.id },
      });
      // Verifica que o save NÃO foi chamado
      expect(mockMessageRepository.save).not.toHaveBeenCalled();
      // Verifica que o logger de erro foi chamado
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining(
          `Erro ao processar job ${mockJob.id}: NotFoundException: Não foi possível encontrar a mensagem`,
        ),
      );
    });

    it('deve logar um erro e relançar se ocorrer uma falha durante o save', async () => {
      const saveError = new Error('Erro de banco de dados');
      jest
        .spyOn(mockMessageRepository, 'findOne')
        .mockResolvedValue(mockMessage);
      // Simula uma falha na primeira chamada do save
      jest
        .spyOn(mockMessageRepository, 'save')
        .mockRejectedValueOnce(saveError);

      await expect(processor.process(mockJob)).rejects.toThrow(saveError);

      // Verifica que o findOne foi chamado
      expect(mockMessageRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockJob.data.id },
      });
      // Verifica que o save foi chamado
      expect(mockMessageRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockMessage.id,
          status: Status.PROCESSING,
        }),
      );
      // Verifica que o logger de erro foi chamado
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining(
          `Erro ao processar job ${mockJob.id}: Error: Erro de banco de dados`,
        ),
      );
    });
  });
});
