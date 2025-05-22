import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './database/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
//import { MessagesModule } from './modules/messages/messages.module';
//import { ConversationsModule } from './modules/conversations/conversations.module';
//import { QueueModule } from './modules/queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    ClientsModule,
    //MessagesModule,
    //ConversationsModule,
    //QueueModule,
  ],
})
export class AppModule {}
