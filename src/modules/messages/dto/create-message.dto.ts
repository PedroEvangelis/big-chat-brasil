import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsNotEmpty, IsIn, IsEnum } from 'class-validator';
import { Priority } from '../../../common/enums/Priority.enum';

export class CreateMessageDto {
  //@IsUUID()
  //@ApiProperty({ description: 'ID da conversa à qual a mensagem pertence', type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' })
  //conversationId: string; // ID da conversa

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID do destinatário da mensagem',
    type: 'string',
    format: 'uuid',
    example: '09876543-21ab-cdef-fedc-ba9876543210',
  })
  recipientId: string; // ID do destinatário

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Conteúdo da mensagem',
    type: 'string',
    example: 'Olá, como você está?',
  })
  content: string; // Conteúdo da mensagem

  @IsEnum(Priority)
  @ApiProperty({
    description: 'Prioridade da mensagem',
    enum: Priority,
    example: Priority.NORMAL,
  })
  priority: Priority; // 'normal' ou 'urgent'
}
