import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from '../messages.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Message } from '../entities/message.entity';
import { Client } from '../../clients/entities/client.entity';
import { Conversation } from '../../conversations/entities/conversation.entity';
import { Repository } from 'typeorm';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateMessageDto } from '../dto/create-message.dto';
import { Priority } from '../../../common/enums/Priority.enum';
import { LoggerService } from '../../../common/logger/logger.service';
import { QueueService } from '../../queue/queue.service';
import { Status } from '../../../common/enums/Status.enum';
import { Document } from '../../../common/enums/Document.enum';
import { Plan } from '../../../common/enums/Plan.enum';
import { Role } from '../../../common/enums/Role.enum';

// Mock do método debit do Client, já que ele não é uma classe real no teste
class MockClient extends Client {
  debit = jest.fn();
}

describe('MessagesService', () => {
  let service: MessagesService;
  let messageRepository: Repository<Message>;
  let clientRepository: Repository<Client>;
  let conversationRepository: Repository<Conversation>;
  let loggerService: LoggerService;
  let queueService: QueueService;

  // Dados mock para os testes
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

  const mockRecipientId = 'recipient456';
  const mockMessageId = 'message123';

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

  const mockCreateMessageDto: CreateMessageDto = {
    content: 'Olá, tudo bem?',
    recipientId: mockRecipientId,
    priority: Priority.NORMAL,
  };

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

  const mockClient = {
    id: mockDataClient.id,
    name: 'Teste Cliente',
    balance: 100,
    debit: jest.fn(), // Mock para o método debit
    save: jest.fn(), // Mock para o método save
  } as unknown as MockClient; // Usar MockClient para ter o debit mockado

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getRepositoryToken(Message),
          useValue: {
            // Métodos mockados para o MessageRepository
            create: jest.fn().mockImplementation((dto) => dto), // Retorna o DTO como se fosse uma entidade criada
            save: jest.fn().mockResolvedValue(mockMessage),
            find: jest.fn().mockResolvedValue([mockMessage]),
            findOne: jest.fn().mockResolvedValue(mockMessage),
          },
        },
        {
          provide: getRepositoryToken(Client),
          useValue: {
            // Métodos mockados para o ClientRepository
            findOne: jest.fn().mockResolvedValue(mockClient),
            save: jest.fn().mockResolvedValue(mockClient),
          },
        },
        {
          provide: getRepositoryToken(Conversation),
          useValue: {
            // Métodos mockados para o ConversationRepository
            findOne: jest.fn().mockResolvedValue(mockDataConversation), // Por padrão encontra uma conversa
            create: jest.fn().mockImplementation((dto) => dto), // Retorna o DTO como se fosse uma entidade criada
            save: jest.fn().mockResolvedValue(mockDataConversation),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            // Mock para LoggerService
            setContext: jest.fn(),
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: QueueService,
          useValue: {
            // Mock para QueueService
            addMessageToQueue: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    messageRepository = module.get<Repository<Message>>(
      getRepositoryToken(Message),
    );
    clientRepository = module.get<Repository<Client>>(
      getRepositoryToken(Client),
    );
    conversationRepository = module.get<Repository<Conversation>>(
      getRepositoryToken(Conversation),
    );
    loggerService = module.get<LoggerService>(LoggerService);
    queueService = module.get<QueueService>(QueueService);
  });

  afterEach(() => {
    // Limpar mocks após cada teste para evitar interferência
    jest.clearAllMocks();
    mockClient.debit.mockClear();
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar uma nova mensagem e debitar o cliente (prioridade NORMAL)', async () => {
      // Configurar mocks para o cenário de criação
      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient);
      jest
        .spyOn(conversationRepository, 'findOne')
        .mockResolvedValue(mockDataConversation); // Encontra uma conversa existente
      jest.spyOn(messageRepository, 'create').mockReturnValue(mockMessage);
      jest.spyOn(messageRepository, 'save').mockResolvedValue(mockMessage);
      jest.spyOn(clientRepository, 'save').mockResolvedValue(mockClient);
      jest
        .spyOn(conversationRepository, 'save')
        .mockResolvedValue(mockDataConversation);

      const result = await service.create(
        mockCreateMessageDto,
        mockDataClient.id,
      );

      // Verificações
      expect(clientRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockDataClient.id },
      });
      expect(mockClient.debit).toHaveBeenCalledWith(0.25); // Custo de prioridade NORMAL
      expect(conversationRepository.findOne).toHaveBeenCalledWith({
        where: { clientId: mockDataClient.id },
      });
      expect(conversationRepository.save).toHaveBeenCalled();
      expect(messageRepository.save).toHaveBeenCalledWith(mockMessage);
      expect(queueService.addMessageToQueue).toHaveBeenCalledWith(
        mockMessage,
        true,
      ); // true para prioridade NORMAL
      expect(clientRepository.save).toHaveBeenCalledWith(mockClient);
      expect(result).toEqual(mockMessage);
    });

    it('deve criar uma nova mensagem e debitar o cliente (prioridade HIGH)', async () => {
      const highPriorityDto: CreateMessageDto = {
        ...mockCreateMessageDto,
        priority: Priority.URGENT,
      };
      const highPriorityMessage: Message = {
        ...mockMessage,
        priority: Priority.URGENT,
      };

      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient);
      jest
        .spyOn(conversationRepository, 'findOne')
        .mockResolvedValue(mockDataConversation);
      jest
        .spyOn(messageRepository, 'create')
        .mockReturnValue(highPriorityMessage);
      jest
        .spyOn(messageRepository, 'save')
        .mockResolvedValue(highPriorityMessage);
      jest.spyOn(clientRepository, 'save').mockResolvedValue(mockClient);
      jest
        .spyOn(conversationRepository, 'save')
        .mockResolvedValue(mockDataConversation);

      const result = await service.create(highPriorityDto, mockDataClient.id);

      expect(mockClient.debit).toHaveBeenCalledWith(0.5); // Custo de prioridade HIGH
      expect(queueService.addMessageToQueue).toHaveBeenCalledWith(
        highPriorityMessage,
        false,
      ); // false para prioridade HIGH
      expect(result).toEqual(highPriorityMessage);
    });

    it('deve lançar UnauthorizedException se o cliente não for encontrado', async () => {
      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.create(mockCreateMessageDto, 'nonExistentClient'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.create(mockCreateMessageDto, 'nonExistentClient'),
      ).rejects.toThrow('Sem autorização para acessar esse recurso');
      expect(clientRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'nonExistentClient' },
      });
      expect(mockClient.debit).not.toHaveBeenCalled(); // Não deve tentar debitar
      expect(messageRepository.save).not.toHaveBeenCalled(); // Não deve salvar a mensagem
    });

    it('deve criar uma nova conversa se não existir uma para o cliente e destinatário', async () => {
      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient);
      jest.spyOn(conversationRepository, 'findOne').mockResolvedValue(null); // Nenhuma conversa existente
      jest
        .spyOn(conversationRepository, 'create')
        .mockReturnValue(mockDataConversation); // Cria nova conversa
      jest
        .spyOn(conversationRepository, 'save')
        .mockResolvedValue(mockDataConversation);
      jest.spyOn(messageRepository, 'create').mockReturnValue(mockMessage);
      jest.spyOn(messageRepository, 'save').mockResolvedValue(mockMessage);
      jest.spyOn(clientRepository, 'save').mockResolvedValue(mockClient);

      await service.create(mockCreateMessageDto, mockDataClient.id);

      expect(conversationRepository.findOne).toHaveBeenCalledWith({
        where: { clientId: mockDataClient.id },
      });
      expect(conversationRepository.create).toHaveBeenCalledWith({
        clientId: mockDataClient.id,
        recipientId: mockRecipientId,
        unreadCount: 0,
      });
    });

    it('deve atualizar uma conversa existente se encontrada', async () => {
      const existingConversation: Conversation = {
        ...mockDataConversation,
        unreadCount: 5,
        lastMessageContent: 'Mensagem antiga',
      };
      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient);
      jest
        .spyOn(conversationRepository, 'findOne')
        .mockResolvedValue(existingConversation); // Encontra uma conversa existente
      jest
        .spyOn(conversationRepository, 'save')
        .mockResolvedValue(existingConversation);
      jest.spyOn(messageRepository, 'create').mockReturnValue(mockMessage);
      jest.spyOn(messageRepository, 'save').mockResolvedValue(mockMessage);
      jest.spyOn(clientRepository, 'save').mockResolvedValue(mockClient);

      await service.create(mockCreateMessageDto, mockDataClient.id);

      expect(conversationRepository.findOne).toHaveBeenCalledWith({
        where: { clientId: mockDataClient.id },
      });
      expect(existingConversation.unreadCount).toBe(6); // Deve ter incrementado
      expect(existingConversation.lastMessageContent).toBe(
        mockCreateMessageDto.content,
      );
      expect(conversationRepository.save).toHaveBeenCalledWith(
        existingConversation,
      );
      expect(conversationRepository.create).not.toHaveBeenCalled(); // Não deve criar nova conversa
    });
  });

  describe('findAll', () => {
    it('deve retornar todas as mensagens enviadas por um cliente', async () => {
      const messages: Message[] = [
        mockMessage,
        { ...mockMessage, id: 'msg2', content: 'Outra mensagem' },
      ];
      jest.spyOn(messageRepository, 'find').mockResolvedValue(messages);

      const result = await service.findAll(mockDataClient.id);

      expect(result).toEqual(messages);
      expect(messageRepository.find).toHaveBeenCalledWith({
        where: { senderId: mockDataClient.id },
      });
    });

    it('deve retornar um array vazio se não houver mensagens para o cliente', async () => {
      jest.spyOn(messageRepository, 'find').mockResolvedValue([]);

      const result = await service.findAll('clientWithoutMessages');

      expect(result).toEqual([]);
      expect(messageRepository.find).toHaveBeenCalledWith({
        where: { senderId: 'clientWithoutMessages' },
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar uma mensagem específica pelo ID e ID do cliente', async () => {
      jest.spyOn(messageRepository, 'findOne').mockResolvedValue(mockMessage);

      const result = await service.findOne(mockMessageId, mockDataClient.id);

      expect(result).toEqual(mockMessage);
      expect(messageRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockMessageId, senderId: mockDataClient.id },
      });
    });

    it('deve lançar NotFoundException se a mensagem não for encontrada para o cliente', async () => {
      jest.spyOn(messageRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.findOne('nonExistentMsg', mockDataClient.id),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne('nonExistentMsg', mockDataClient.id),
      ).rejects.toThrow('Message with ID "nonExistentMsg" not found');
      expect(messageRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'nonExistentMsg', senderId: mockDataClient.id },
      });
    });

    it('deve lançar NotFoundException se a mensagem existir, mas não pertencer ao cliente', async () => {
      const anotherClientMessage: Message = {
        ...mockMessage,
        senderId: 'anotherClient',
      };
      jest.spyOn(messageRepository, 'findOne').mockResolvedValue(null); // Simula que não encontrou para o ID do cliente certo

      await expect(
        service.findOne(mockMessageId, 'anotherClient'),
      ).rejects.toThrow(NotFoundException);
      expect(messageRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockMessageId, senderId: 'anotherClient' },
      });
    });
  });

  describe('findStatus', () => {
    it('deve retornar o status de uma mensagem específica pelo ID e ID do usuário', async () => {
      jest.spyOn(messageRepository, 'findOne').mockResolvedValue(mockMessage);

      const result = await service.findStatus(mockMessageId, mockDataClient.id);

      expect(result).toEqual({ status: mockMessage.status });
      expect(messageRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockMessageId, senderId: mockDataClient.id },
      });
    });

    it('deve lançar NotFoundException se a mensagem não for encontrada para o usuário', async () => {
      jest.spyOn(messageRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.findStatus('nonExistentStatusMsg', mockDataClient.id),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findStatus('nonExistentStatusMsg', mockDataClient.id),
      ).rejects.toThrow('Message with ID "nonExistentStatusMsg" not found');
      expect(messageRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'nonExistentStatusMsg', senderId: mockDataClient.id },
      });
    });
  });
});
