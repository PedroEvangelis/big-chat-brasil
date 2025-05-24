import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from '../messages.controller';
import { MessagesService } from '../messages.service';
import { LoggerService } from '../../../common/logger/logger.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { Message } from '../entities/message.entity';
import { Client } from '../../clients/entities/client.entity';
import {
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Priority } from '../../../common/enums/Priority.enum';
import { Plan } from '../../../common/enums/Plan.enum';
import { Document } from '../../../common/enums/Document.enum';
import { Role } from '../../../common/enums/Role.enum';
import { Conversation } from '../../../modules/conversations/entities/conversation.entity';
import { Status } from '../../../common/enums/Status.enum';

// Mock de um usuário cliente
const mockClient: Client = {
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
  clientId: mockClient.id,
  client: mockClient,
  recipientId: 'rec-456',
  recipient: {
    ...mockClient,
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
  recipient: mockClient,
  sender: mockClient,
  senderId: mockClient.id,
  status: Status.DELIVERED,
  active: true,
  cost: 0.25,
  priority: Priority.NORMAL,
  recipientId: mockClient.id,
  timestamp: new Date(),
};

describe('MessagesController', () => {
  let controller: MessagesController;
  let service: MessagesService;
  let logger: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: {
            // Métodos mockados do MessagesService
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findStatus: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            // Métodos mockados do LoggerService
            setContext: jest.fn(),
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
    service = module.get<MessagesService>(MessagesService);
    logger = module.get<LoggerService>(LoggerService);
  });

  it('deve ser definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('deve criar uma nova mensagem com sucesso', async () => {
      const createDto: CreateMessageDto = {
        content: 'Teste de mensagem',
        recipientId: 'rec456',
        priority: Priority.NORMAL,
      };
      jest.spyOn(service, 'create').mockResolvedValue(mockMessage);

      const result = await controller.create(createDto, mockClient);

      expect(service.create).toHaveBeenCalledWith(createDto, mockClient.id);
      expect(result).toEqual(mockMessage);
      expect(logger.log).toHaveBeenCalledWith(
        'Executando envio de nova mensagem',
      );
    });

    it('deve lançar UnauthorizedException se o serviço retornar UnauthorizedException', async () => {
      const createDto: CreateMessageDto = {
        content: 'Teste de mensagem',
        recipientId: 'rec456',
        priority: Priority.NORMAL,
      };
      jest
        .spyOn(service, 'create')
        .mockRejectedValue(
          new UnauthorizedException(
            'Sem autorização para acessar esse recurso',
          ),
        );

      await expect(controller.create(createDto, mockClient)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.create(createDto, mockClient)).rejects.toThrow(
        'Sem autorização para acessar esse recurso',
      );
      expect(logger.log).toHaveBeenCalledWith(
        'Executando envio de nova mensagem',
      );
    });

    // Teste para BadRequestException (geralmente vindo de validação de DTO, mas simulamos aqui)
    it('deve lançar BadRequestException para dados inválidos', async () => {
      const invalidDto: CreateMessageDto = {
        content: '', // Conteúdo vazio
        recipientId: 'rec456',
        priority: Priority.NORMAL,
      };
      // Em um cenário real, o Pipe de Validação (ValidationPipe) faria isso antes mesmo do controller.
      // Aqui, simulamos que o serviço ou alguma validação anterior lançaria.
      jest
        .spyOn(service, 'create')
        .mockRejectedValue(
          new BadRequestException('Conteúdo da mensagem não pode ser vazio.'),
        );

      await expect(controller.create(invalidDto, mockClient)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.create(invalidDto, mockClient)).rejects.toThrow(
        'Conteúdo da mensagem não pode ser vazio.',
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar todas as mensagens do cliente autenticado', async () => {
      const messages: Message[] = [mockMessage, { ...mockMessage, id: 'msg2' }];
      jest.spyOn(service, 'findAll').mockResolvedValue(messages);

      const result = await controller.findAll(mockClient);

      expect(service.findAll).toHaveBeenCalledWith(mockClient.id);
      expect(result).toEqual(messages);
      expect(logger.log).toHaveBeenCalledWith(
        'Executando busca de todas as mensagens do cliente autenticado.',
      );
    });

    it('deve retornar um array vazio se não houver mensagens', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([]);

      const result = await controller.findAll(mockClient);

      expect(service.findAll).toHaveBeenCalledWith(mockClient.id);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma mensagem específica pelo ID', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockMessage);

      const result = await controller.findOne(mockMessage.id, mockClient);

      expect(service.findOne).toHaveBeenCalledWith(
        mockMessage.id,
        mockClient.id,
      );
      expect(result).toEqual(mockMessage);
      expect(logger.log).toHaveBeenCalledWith(
        `Executando busca da mensagem com ID: ${mockMessage.id}`,
      );
    });

    it('deve lançar NotFoundException se a mensagem não for encontrada', async () => {
      jest.spyOn(service, 'findOne').mockReturnValue(null!);

      await expect(
        controller.findOne('nonExistentId', mockClient),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.findOne('nonExistentId', mockClient),
      ).rejects.toThrow(
        'Mensagem com ID "nonExistentId" não encontrada ou você não tem acesso.',
      );
      expect(service.findOne).toHaveBeenCalledWith(
        'nonExistentId',
        mockClient.id,
      );
    });

    it('deve lançar NotFoundException se o serviço lançar NotFoundException', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(
          new NotFoundException('Mensagem com ID "someId" não encontrada.'),
        );

      await expect(controller.findOne('someId', mockClient)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findOne('someId', mockClient)).rejects.toThrow(
        'Mensagem com ID "someId" não encontrada.',
      );
    });
  });

  describe('findStatus', () => {
    it('deve retornar o status de uma mensagem com sucesso', async () => {
      const statusResponse = { status: 'read' };
      jest.spyOn(service, 'findStatus').mockResolvedValue(statusResponse);

      const result = await controller.findStatus(mockMessage.id, mockClient);

      expect(service.findStatus).toHaveBeenCalledWith(
        mockMessage.id,
        mockClient.id,
      );
      expect(result).toEqual(statusResponse);
      expect(logger.log).toHaveBeenCalledWith(
        `Executando busca de status da mensagem com ID: ${mockMessage.id}`,
      );
    });

    it('deve lançar NotFoundException se o status da mensagem não for encontrado', async () => {
      jest.spyOn(service, 'findStatus').mockReturnValue(null!);

      await expect(
        controller.findStatus('nonExistentStatusId', mockClient),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.findStatus('nonExistentStatusId', mockClient),
      ).rejects.toThrow(
        'Status para mensagem com ID "nonExistentStatusId" não encontrado.',
      );
      expect(service.findStatus).toHaveBeenCalledWith(
        'nonExistentStatusId',
        mockClient.id,
      );
    });

    it('deve lançar NotFoundException se o serviço lançar NotFoundException', async () => {
      jest
        .spyOn(service, 'findStatus')
        .mockRejectedValue(
          new NotFoundException('Message with ID "otherId" not found'),
        );

      await expect(
        controller.findStatus('otherId', mockClient),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.findStatus('otherId', mockClient),
      ).rejects.toThrow('Message with ID "otherId" not found');
    });
  });
});
