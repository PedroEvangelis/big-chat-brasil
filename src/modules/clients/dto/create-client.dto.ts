import { IsNotEmpty, IsString, IsBoolean } from '@nestjs/class-validator';
import { Plan } from '../../../common/enums/Plan.enum';
import { Document } from '../../../common/enums/Document.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsCpfOrCnpj } from '../../../common/decorators/IsCpfOrCnpjConstraint.decorator';

export class CreateClientDto {
  @ApiProperty({ description: 'Nome do cliente', example: 'João Batista' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Documento do cliente (CPF ou CNPJ)',
    example: '92382166061',
  })
  @IsNotEmpty()
  @IsString()
  @IsCpfOrCnpj({ message: 'O CPF ou CNPJ informado é inválido' })
  documentId: string; // CPF ou CNPJ

  @ApiProperty({
    description: 'Tipo de documento do cliente',
    example: Document.CPF,
  })
  @IsNotEmpty()
  @IsString()
  documentType: Document;

  @ApiProperty({
    description: 'O plano escolhido de assinatura',
    example: Plan.POSTPAID,
  })
  @IsNotEmpty()
  @IsString()
  planType: Plan;
}
