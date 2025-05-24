import { Test, TestingModule } from '@nestjs/testing';
import { QueueController } from '../queue.controller';
import { QueueService } from '../queue.service';

describe('QueueController', () => {
  let controller: QueueController;
  let service: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueController],
      providers: [
        {
          provide: QueueService,
          useValue: {
            // Mock do método do QueueService
            getQueueMetrics: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<QueueController>(QueueController);
    service = module.get<QueueService>(QueueService);
  });

  it('deve ser definido', () => {
    expect(controller).toBeDefined();
  });

  describe('getQueueStatus', () => {
    it('deve retornar as métricas da fila do serviço', async () => {
      const mockMetrics = {
        metrics: {
          completed: 10,
          failed: 2,
          waiting: 5,
        },
      };
      jest.spyOn(service, 'getQueueMetrics').mockResolvedValue(mockMetrics);

      const result = await controller.getQueueStatus();

      expect(service.getQueueMetrics).toHaveBeenCalled();
      expect(result).toEqual(mockMetrics);
    });

    it('deve lidar com erros do serviço ao buscar as métricas', async () => {
      jest
        .spyOn(service, 'getQueueMetrics')
        .mockRejectedValue(new Error('Erro ao conectar com a fila'));

      await expect(controller.getQueueStatus()).rejects.toThrow(
        'Erro ao conectar com a fila',
      );
      expect(service.getQueueMetrics).toHaveBeenCalled();
    });
  });
});
