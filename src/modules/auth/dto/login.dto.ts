import { IsEnum, IsNotEmpty, IsString } from '@nestjs/class-validator';
import { Plan } from '../../../common/enums/Plan.enum';
import { Document } from '../../../common/enums/Document.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsCpfOrCnpj } from '../../../common/decorators/IsCpfOrCnpjConstraint.decorator';

export class LoginRequestDto {
  @ApiProperty({
    description: 'Documento do cliente (CPF ou CNPJ)',
    example: '92382166061',
  })
  @IsNotEmpty()
  @IsString()
  @IsCpfOrCnpj({ message: 'O CPF ou CNPJ informado é inválido' })
  documentId: string; // CPF ou CNPJ

  @ApiProperty({ description: 'Tipo de documento', example: Document.CNPJ })
  @IsNotEmpty()
  @IsEnum(Document)
  documentType: Document; // CPF ou CNPJ
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Token de autenticação' })
  token: string;

  @ApiProperty({ description: 'Dados do cliente' })
  client: {
    id: string;
    name: string;
    documentId: string;
    documentType: Document;
    planType: Plan;
    active: boolean;
    balance?: number;
    limit?: number;
  };
}
