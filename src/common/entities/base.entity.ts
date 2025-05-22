import { ApiProperty } from '@nestjs/swagger';
import {
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @ApiProperty({ description: 'ID da entidade', type: 'string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Status de atividade da entidade', type: 'boolean' })
  @Column({ type: 'boolean', default: true })
  active: boolean;

  @ApiProperty({ description: 'Data de criação da entidade', type: 'string' })
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createDateTime: Date;

  @ApiProperty({ description: 'Data da última alteração da entidade', type: 'string' })
  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastChangedDateTime: Date;
}
