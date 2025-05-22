import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Plan } from '../../../common/enums/Plan.enum';
import { Document } from '../../../common/enums/Document.enum';
import { Role } from '../../../common/enums/Role.enum';

@Entity('clients')
export class Client extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  documentId: string; // CPF ou CNPJ

  @Column({ type: 'enum', enum: Document })
  documentType: Document; // 'CPF' ou 'CNPJ'

  @Column({ type: 'enum', enum: Plan })
  planType: Plan; // 'prepaid' ou 'postpaid'

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  balance: number; // Saldo (para pré-pago)

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  limit: number; // Limite (para pós-pago)

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role; // User ou Admin
}
