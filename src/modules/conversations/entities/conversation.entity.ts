import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

import { Client } from '../../clients/entities/client.entity';
import { Message } from '../../messages/entities/message.entity';

@Entity('conversations')
export class Conversation extends BaseEntity {
  constructor() {
    super();
    this.recipientName = this.recipient?.name;
  }

  @ApiProperty({
    description: 'ID do cliente que possui a conversa',
    type: 'string',
    format: 'uuid',
  })
  @Column({ type: 'uuid' })
  clientId: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @ApiProperty({
    description: 'ID do destinatário',
    type: 'string',
    format: 'uuid',
  })
  @Column({ type: 'uuid' })
  recipientId: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient: Client;

  @ApiProperty({ description: 'Nome do destinatário', type: 'string' })
  recipientName: string;

  @ApiProperty({
    description: 'Última mensagem do chat',
    type: 'string',
    nullable: true,
  })
  @Column('text', { nullable: true })
  lastMessageContent: string;

  @ApiProperty({
    description: 'Data da última mensagem',
    type: 'string',
    format: 'date-time',
  })
  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastMessageTime: Date;

  @ApiProperty({
    description: 'Quantidade de mensagens não lidas',
    type: 'number',
    minimum: 0,
  })
  @Column({ type: 'int', default: 0 })
  unreadCount: number;

  @ManyToOne(() => Message, (message) => message.conversation)
  messages: Message[];
}
