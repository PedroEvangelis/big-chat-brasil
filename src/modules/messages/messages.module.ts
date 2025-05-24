import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { Message } from './entities/message.entity';
import { Client } from '../clients/entities/client.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { LoggerService } from '../../common/logger/logger.service';
import { QueueService } from '../queue/queue.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Client, Conversation]),
    QueueModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, LoggerService],
})
export class MessagesModule {}
