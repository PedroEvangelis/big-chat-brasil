import { Test, TestingModule } from '@nestjs/testing';
import { ConversationsService } from '../conversations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../../messages/entities/message.entity';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Status } from '../../../common/enums/Status.enum';
import { Priority } from '../../../common/enums/Priority.enum';
import { Role } from '../../../common/enums/Role.enum';
import { Plan } from '../../../common/enums/Plan.enum';
import { Document } from '../../../common/enums/Document.enum';
import { Client } from '../../../modules/clients/entities/client.entity';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let conversationRepository: Repository<Conversation>;
  let messageRepository: Repository<Message>;

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

  const mockMessage: Message = {
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: {
            // Mock de métodos do TypeORM Repository
            find: jest.fn(),
            findOne: jest.fn(),
            exists: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Message),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
    conversationRepository = module.get<Repository<Conversation>>(
      getRepositoryToken(Conversation),
    );
    messageRepository = module.get<Repository<Message>>(
      getRepositoryToken(Message),
    );
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  // --- Testes para findAll ---
  describe('findAll', () => {
    it('deve retornar todas as conversas para um usuário autenticado', async () => {
      const authenticatedUserId = 'user123';
      const conversations: Conversation[] = [
        mockConversation,
        { ...mockConversation, id: 'conv2' },
      ];
      jest
        .spyOn(conversationRepository, 'find')
        .mockResolvedValue(conversations);

      const result = await service.findAll(authenticatedUserId);
      expect(result).toEqual(conversations);
      expect(conversationRepository.find).toHaveBeenCalledWith({
        where: { clientId: authenticatedUserId },
      });
    });

    it('deve retornar um array vazio se não houver conversas para o usuário', async () => {
      const authenticatedUserId = 'user456';
      jest.spyOn(conversationRepository, 'find').mockResolvedValue([]);

      const result = await service.findAll(authenticatedUserId);
      expect(result).toEqual([]);
      expect(conversationRepository.find).toHaveBeenCalledWith({
        where: { clientId: authenticatedUserId },
      });
    });
  });

  // --- Testes para findOne ---
  describe('findOne', () => {
    it('deve retornar uma conversa pelo ID', async () => {
      jest
        .spyOn(conversationRepository, 'findOne')
        .mockResolvedValue(mockConversation);

      const result = await service.findOne('conv1');
      expect(result).toEqual(mockConversation);
      expect(conversationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'conv1' },
      });
    });

    it('deve lançar NotFoundException se a conversa não for encontrada', async () => {
      jest.spyOn(conversationRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonExistentId')).rejects.toThrow(
        'Conversa com ID "nonExistentId" não encontrada.',
      );
      expect(conversationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'nonExistentId' },
      });
    });
  });

  // --- Testes para findMessages ---
  describe('findMessages', () => {
    it('deve retornar todas as mensagens de uma conversa', async () => {
      const messages: Message[] = [
        mockMessage,
        { ...mockMessage, id: 'msg2', content: 'Tudo bem?' },
      ];
      jest.spyOn(conversationRepository, 'exists').mockResolvedValue(true);
      jest.spyOn(messageRepository, 'find').mockResolvedValue(messages);

      const result = await service.findMessages('conv1');
      expect(result).toEqual(messages);
      expect(conversationRepository.exists).toHaveBeenCalledWith({
        where: { id: 'conv1' },
      });
      expect(messageRepository.find).toHaveBeenCalledWith({
        where: { conversation: { id: 'conv1' } },
        order: { createDateTime: 'ASC' },
      });
    });

    it('deve lançar NotFoundException se a conversa não existir ao buscar mensagens', async () => {
      jest.spyOn(conversationRepository, 'exists').mockResolvedValue(false);

      await expect(service.findMessages('nonExistentConv')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findMessages('nonExistentConv')).rejects.toThrow(
        'Conversa com ID "nonExistentConv" não encontrada.',
      );
      expect(conversationRepository.exists).toHaveBeenCalledWith({
        where: { id: 'nonExistentConv' },
      });
      expect(messageRepository.find).not.toHaveBeenCalled(); // Garante que find de mensagens não é chamado
    });

    it('deve retornar um array vazio se a conversa existir, mas não houver mensagens', async () => {
      jest.spyOn(conversationRepository, 'exists').mockResolvedValue(true);
      jest.spyOn(messageRepository, 'find').mockResolvedValue([]);

      const result = await service.findMessages('conv1');
      expect(result).toEqual([]);
      expect(conversationRepository.exists).toHaveBeenCalledWith({
        where: { id: 'conv1' },
      });
      expect(messageRepository.find).toHaveBeenCalledWith({
        where: { conversation: { id: 'conv1' } },
        order: { createDateTime: 'ASC' },
      });
    });
  });
});
