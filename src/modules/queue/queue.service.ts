import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Job } from 'bullmq';
import { LoggerService } from '../../common/logger/logger.service';
import { Message } from '../messages/entities/message.entity';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('queue')
    private readonly queue: Queue,
    private readonly logger: LoggerService,
  ) {
    logger.setContext(QueueService.name);
  }

  async addMessageToQueue(
    message: Message,
    isPriority: boolean = false,
  ): Promise<Job> {
    this.logger.log(`Adicionando mensagem ${message.id} à fila.`);

    return await this.queue.add(message.id, message, {
      priority: isPriority ? 1 : 2,
      jobId: message.id,
    });
  }

  async getJobStatus(messageId: string, isPriority: boolean): Promise<any> {
    const job = await this.queue.getJob(messageId);

    if (!job) {
      return null;
    }
    const state = await job.getState();

    return state;
  }

  async getQueueMetrics(): Promise<any> {
    return {
      metrics: {
        completed: await this.queue.getCompleted(),
        failed: await this.queue.getFailed(),
      },
    };
  }
}
