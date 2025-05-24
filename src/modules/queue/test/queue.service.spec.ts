import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from '../queue.service';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { LoggerService } from '../../../common/logger/logger.service';
import { Message } from '../../messages/entities/message.entity';
import { Priority } from '../../../common/enums/Priority.enum';
import { Status } from '../../../common/enums/Status.enum';
import { Document } from '../../../common/enums/Document.enum';
import { Plan } from '../../../common/enums/Plan.enum';
import { Role } from '../../../common/enums/Role.enum';
import { Client } from '../../../modules/clients/entities/client.entity';
import { Conversation } from '../../../modules/conversations/entities/conversation.entity';

describe('QueueService', () => {
  let service: QueueService;
  let mockQueue: Queue;
  let mockLogger: LoggerService;

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

  const mockJob: Job = {
    id: 'msg123',
    name: 'msg123',
    data: mockMessage,
    opts: {
      priority: 2,
      jobId: 'msg123',
    },
    finishedOn: undefined,
    processedOn: undefined,
    returnvalue: undefined,
    timestamp: Date.now(),
    getState: jest.fn(),
  } as unknown as Job; // Força o tipo para Job, já que estamos mockando

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: getQueueToken('queue'), // O nome da fila injetada
          useValue: {
            // Métodos mockados da Queue do BullMQ
            add: jest.fn(),
            getJob: jest.fn(),
            getCompleted: jest.fn(),
            getFailed: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            setContext: jest.fn(),
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
    mockQueue = module.get<Queue>(getQueueToken('queue'));
    mockLogger = module.get<LoggerService>(LoggerService);
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('addMessageToQueue', () => {
    it('deve adicionar uma mensagem à fila com prioridade normal', async () => {
      // Mock do retorno de 'add' do BullMQ
      jest.spyOn(mockQueue, 'add').mockResolvedValue(mockJob);

      const result = await service.addMessageToQueue(mockMessage, false);

      expect(mockLogger.log).toHaveBeenCalledWith(
        `Adicionando mensagem ${mockMessage.id} à fila.`,
      );
      expect(mockQueue.add).toHaveBeenCalledWith(
        mockMessage.id, // O nome do trabalho (job name)
        mockMessage, // Os dados do trabalho (job data)
        { priority: 2, jobId: mockMessage.id }, // Opções do trabalho (priority: 2 para normal)
      );
      expect(result).toEqual(mockJob);
    });

    it('deve adicionar uma mensagem à fila com prioridade alta', async () => {
      const highPriorityMessage: Message = {
        ...mockMessage,
        priority: Priority.URGENT,
      };
      const highPriorityJob: Job = {
        ...mockJob,
        data: highPriorityMessage,
        opts: { priority: 1, jobId: highPriorityMessage.id },
      } as unknown as Job;
      jest.spyOn(mockQueue, 'add').mockResolvedValue(highPriorityJob);

      const result = await service.addMessageToQueue(highPriorityMessage, true);

      expect(mockLogger.log).toHaveBeenCalledWith(
        `Adicionando mensagem ${highPriorityMessage.id} à fila.`,
      );
      expect(mockQueue.add).toHaveBeenCalledWith(
        highPriorityMessage.id,
        highPriorityMessage,
        { priority: 1, jobId: highPriorityMessage.id }, // Opções do trabalho (priority: 1 para alta)
      );
      expect(result).toEqual(highPriorityJob);
    });
  });

  describe('getJobStatus', () => {
    it('deve retornar o status de um job existente', async () => {
      // Mock do job e seu estado
      mockJob.getState = jest.fn().mockResolvedValue('completed');
      jest.spyOn(mockQueue, 'getJob').mockResolvedValue(mockJob);

      const result = await service.getJobStatus(mockMessage.id, false); // isPriority não é usado aqui, mas manter para consistência

      expect(mockQueue.getJob).toHaveBeenCalledWith(mockMessage.id);
      expect(mockJob.getState).toHaveBeenCalled();
      expect(result).toBe('completed');
    });

    it('deve retornar null se o job não for encontrado', async () => {
      jest.spyOn(mockQueue, 'getJob').mockResolvedValue(null);

      const result = await service.getJobStatus('nonExistentJobId', false);

      expect(mockQueue.getJob).toHaveBeenCalledWith('nonExistentJobId');
      expect(result).toBeNull();
    });
  });

  describe('getQueueMetrics', () => {
    it('deve retornar as métricas da fila', async () => {
      jest.spyOn(mockQueue, 'getCompleted').mockResolvedValue([
        { id: 'job1', name: 'job1', data: {}, finishedOn: Date.now() },
        { id: 'job2', name: 'job2', data: {}, finishedOn: Date.now() },
      ] as Job[]);
      jest
        .spyOn(mockQueue, 'getFailed')
        .mockResolvedValue([
          {
            id: 'job3',
            name: 'job3',
            data: {},
            failedReason: 'erro',
            finishedOn: Date.now(),
          },
        ] as Job[]);

      const result = await service.getQueueMetrics();

      expect(mockQueue.getCompleted).toHaveBeenCalled();
      expect(mockQueue.getFailed).toHaveBeenCalled();
      expect(result).toEqual({
        metrics: {
          completed: expect.any(Array),
          failed: expect.any(Array),
        },
      });
    });
  });
});
