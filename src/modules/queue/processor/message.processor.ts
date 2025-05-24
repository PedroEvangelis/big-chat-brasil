import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue } from 'bullmq';
import { LoggerService } from '../../../common/logger/logger.service';
import { Message } from '../../messages/entities/message.entity';
import { Repository } from 'typeorm';
import { Status } from '../../../common/enums/Status.enum';

@Processor('queue')
@Injectable()
export class MessageProcessor extends WorkerHost {
  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {
    super();
    logger.setContext(MessageProcessor.name);
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `Processando job da fila ${job.queueName} com ID ${job.id}`,
    );

    try {
      const message = await this.messageRepository.findOne({
        where: { id: job.data.id },
      });
      if (!message) {
        throw new NotFoundException('Não foi possível encontrar a mensagem');
      }

      message.status = Status.PROCESSING;
      await this.messageRepository.save(message);

      await new Promise((res) => setTimeout(res, 500)); // Simula execução

      message.status = Status.DELIVERED;
      await this.messageRepository.save(message);

      return { status: 'success', messageId: job.data.id };
    } catch (err) {
      this.logger.error(`Erro ao processar job ${job.id}: ${err}`);
      throw err;
    }
  }
}
