import { Test, TestingModule } from '@nestjs/testing';
import { ConversationsController } from '../conversations.controller';
import { ConversationsService } from '../conversations.service';
import { LoggerService } from '../../../common/logger/logger.service';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../../messages/entities/message.entity';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Client } from '../../clients/entities/client.entity';
import { Role } from '../../../common/enums/Role.enum';
import { Plan } from '../../../common/enums/Plan.enum';
import { Document } from '../../../common/enums/Document.enum';
import { Status } from '../../../common/enums/Status.enum';
import { Priority } from '../../../common/enums/Priority.enum';

// --- Mocks ---
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

const mockConversation: Conversation = {
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

const mockConversations: Conversation[] = [
  mockConversation,
  {
    ...mockConversation,
    id: 'conversation-id-2',
    clientId: mockClient.id,
    createDateTime: new Date(),
    lastChangedDateTime: new Date(),
    messages: [],
  },
];

const mockMessages: Message[] = [
  {
    id: 'message-id-1',
    conversationId: mockConversation.id,
    conversation: mockConversation,
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
  },
];

describe('ConversationsController', () => {
  let controller: ConversationsController;
  let conversationsService: ConversationsService;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationsController],
      providers: [
        {
          provide: ConversationsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            findMessages: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            setContext: jest.fn(),
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ConversationsController>(ConversationsController);
    conversationsService =
      module.get<ConversationsService>(ConversationsService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('deve retornar um array das conversas do usuário autenticado', async () => {
      jest
        .spyOn(conversationsService, 'findAll')
        .mockResolvedValue(mockConversations);

      const result = await controller.findAll(mockClient);

      expect(result).toEqual(mockConversations);
      expect(conversationsService.findAll).toHaveBeenCalledWith(mockClient.id);
    });

    it('deve lidar com erros ao buscar conversas', async () => {
      const error = new Error('Erro de Banco de Dados');
      jest.spyOn(conversationsService, 'findAll').mockRejectedValue(error);

      await expect(controller.findAll(mockClient)).rejects.toThrow(error);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma única conversa se encontrada e o cliente estiver autorizado', async () => {
      jest
        .spyOn(conversationsService, 'findOne')
        .mockResolvedValue(mockConversation);

      const result = await controller.findOne(mockConversation.id, mockClient);

      expect(result).toEqual(mockConversation);
      expect(conversationsService.findOne).toHaveBeenCalledWith(
        mockConversation.id,
      );
    });

    it('deve lançar UnauthorizedException se o cliente não for o proprietário da conversa', async () => {
      const conversationOwnedByAnotherClient: Conversation = {
        ...mockConversation,
        clientId: 'another-client-id',
      };
      jest
        .spyOn(conversationsService, 'findOne')
        .mockResolvedValue(conversationOwnedByAnotherClient);

      await expect(
        controller.findOne(mockConversation.id, mockClient),
      ).rejects.toThrow(UnauthorizedException);
      expect(loggerService.warn).toHaveBeenCalledWith(
        `Tentativa de acesso não autorizado à conversa ID: ${mockConversation.id} pelo cliente ID: ${mockClient.id}.`,
      );
    });

    it('deve lidar com erros genéricos ao buscar uma única conversa', async () => {
      const error = new Error('Erro de Serviço');
      jest.spyOn(conversationsService, 'findOne').mockRejectedValue(error);

      await expect(
        controller.findOne(mockConversation.id, mockClient),
      ).rejects.toThrow(error);
      expect(loggerService.error).toHaveBeenCalledWith(
        `Erro ao buscar conversa com ID: ${mockConversation.id} para o cliente ID: ${mockClient.id}. Erro: ${error.message}`,
        error.stack,
      );
    });
  });

  describe('findMessages', () => {
    it('deve retornar um array de mensagens para uma determinada conversa se encontrada e o cliente estiver autorizado', async () => {
      jest
        .spyOn(conversationsService, 'findOne')
        .mockResolvedValue(mockConversation);
      jest
        .spyOn(conversationsService, 'findMessages')
        .mockResolvedValue(mockMessages);

      const result = await controller.findMessages(
        mockConversation.id,
        mockClient,
      );

      expect(result).toEqual(mockMessages);
      expect(conversationsService.findOne).toHaveBeenCalledWith(
        mockConversation.id,
      );
      expect(conversationsService.findMessages).toHaveBeenCalledWith(
        mockConversation.id,
      );
    });

    it('deve lidar com erros genéricos ao buscar mensagens', async () => {
      const error = new Error('Erro de Serviço');
      jest
        .spyOn(conversationsService, 'findOne')
        .mockResolvedValue(mockConversation);
      jest.spyOn(conversationsService, 'findMessages').mockRejectedValue(error);

      await expect(
        controller.findMessages(mockConversation.id, mockClient),
      ).rejects.toThrow(error);
    });
  });
});
