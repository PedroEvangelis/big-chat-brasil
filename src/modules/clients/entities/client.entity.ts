import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Plan } from '../../../common/enums/Plan.enum';
import { Document } from '../../../common/enums/Document.enum';
import { Role } from '../../../common/enums/Role.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

@Entity('clients')
export class Client extends BaseEntity {
  @ApiProperty({ description: 'Nome do cliente' , type: 'string'})
  @Column()
  name: string;

  @ApiProperty({ description: 'Documento do cliente CPF/CNPJ' , type: 'string'})
  @Column({ unique: true })
  documentId: string; // CPF ou CNPJ

  @ApiProperty({ description: 'Tipo do documento do cliente CPF/CNPJ',  type: 'string'})
  @Column({ type: 'enum', enum: Document })
  documentType: Document; // 'CPF' ou 'CNPJ'

  @ApiProperty({ description: 'Plano selecionado', type: 'string' })
  @Column({ type: 'enum', enum: Plan })
  planType: Plan; // 'prepaid' ou 'postpaid'

  @ApiProperty({ description: 'Saldo para clientes pré-pago', type: 'number' })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  balance: number; // Saldo (para pré-pago)

  @ApiProperty({ description: 'Limite para clientes pós-pago', type: 'number' })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  limit: number; // Limite (para pós-pago)

  @Exclude()
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role; // User ou Admin
}
