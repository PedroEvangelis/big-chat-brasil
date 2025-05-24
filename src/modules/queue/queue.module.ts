import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MessageProcessor } from './processor/message.processor';
import { QueueService } from './queue.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'src/common/logger/logger.module';
import { Message } from '../messages/entities/message.entity';
import { QueueController } from './queue.controller';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
        },
      }),
    }),
    BullModule.registerQueue({ name: 'queue' }),
    TypeOrmModule.forFeature([Message]),
    LoggerModule,
  ],
  providers: [MessageProcessor, QueueService],
  exports: [QueueService],
  controllers: [QueueController],
})
export class QueueModule {}
