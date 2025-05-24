import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Conversation } from '../../conversations/entities/conversation.entity';
import { Client } from '../../clients/entities/client.entity';
import { Status } from '../../../common/enums/Status.enum';
import { Priority } from '../../../common/enums/Priority.enum';

@Entity('messages')
export class Message extends BaseEntity {
  @Column({ type: 'uuid' })
  @ApiProperty({
    description: 'ID da conversa à qual a mensagem pertence',
    type: 'string',
    format: 'uuid',
  })
  conversationId: string; // ID da conversa

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation; // Objeto da conversa

  @Column({ type: 'uuid' })
  @ApiProperty({
    description: 'ID do cliente que enviou a mensagem',
    type: 'string',
    format: 'uuid',
  })
  senderId: string; // ID do cliente que enviou

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: Client; // Objeto do remetente

  @Column({ type: 'uuid' })
  @ApiProperty({
    description: 'ID do destinatário da mensagem',
    type: 'string',
    format: 'uuid',
  })
  recipientId: string; // ID do destinatário

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient: Client; // Objeto do destinatário

  @Column('text')
  @ApiProperty({ description: 'Conteúdo da mensagem', type: 'string' })
  content: string; // Conteúdo da mensagem

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  @ApiProperty({
    description: 'Timestamp da mensagem',
    type: 'string',
    format: 'date-time',
  })
  timestamp: Date; // Timestamp da mensagem

  @Column({ type: 'varchar', enum: Priority, default: Priority.NORMAL })
  @ApiProperty({
    description: 'Prioridade da mensagem',
    enum: Priority, // Define os valores possíveis no Swagger
    example: Priority.NORMAL,
  })
  priority: Priority; // 'normal' ou 'urgent'

  @Column({ type: 'enum', enum: Status, default: Status.QUEUED })
  @ApiProperty({
    description: 'Status da mensagem',
    enum: Status, // Define os valores possíveis no Swagger
    example: Status.SENT,
  })
  status: Status; // 'queued', 'processing', 'sent', 'delivered', 'read', 'failed'

  @Column('decimal', { precision: 10, scale: 2, default: 0.25 })
  @ApiProperty({
    description: 'Custo da mensagem (0.25 normal, 0.50 urgente)',
    type: 'number',
    format: 'float',
    example: 0.25,
  })
  cost: number; // Custo da mensagem (0.25 normal, 0.50 urgente)
}
