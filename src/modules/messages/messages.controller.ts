import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger'; // Adicionado ApiBody
import { LoggerService } from '../../common/logger/logger.service';
import { MessagesService } from './messages.service';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { GetUser } from '../../common/decorators/user.decorator';
import { Client } from '../clients/entities/client.entity';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(MessagesController.name);
  }

  /**
   * @route POST /messages
   * @description Envia uma nova mensagem.
   */
  @Post()
  @ApiOperation({
    summary: 'Envia uma nova mensagem',
    description:
      'Permite que o cliente autenticado envie uma nova mensagem para uma conversa existente.',
  })
  @ApiBody({
    type: CreateMessageDto,
    description: 'Dados da mensagem a ser criada.',
    examples: {
      a: {
        summary: 'Exemplo de envio de mensagem de texto',
        value: {
          recipientId: 'exemplo_id_conversa_123',
          content: 'Olá, tudo bem?',
          priority: 'normal',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Mensagem enviada com sucesso.',
    type: Message,
  })
  @ApiResponse({
    status: 400,
    description:
      'Requisição inválida. Verifique os dados fornecidos no corpo da requisição.',
  })
  @ApiResponse({
    status: 401,
    description:
      'Acesso não autorizado. O token de autenticação JWT é inválido ou não foi fornecido.',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor ao processar a requisição.',
  })
  async create(
    @Body() createMessageDto: CreateMessageDto,
    @GetUser() user: Client,
  ): Promise<Message> {
    this.logger.log('Executando envio de nova mensagem');
    return this.messagesService.create(createMessageDto, user.id);
  }

  /**
   * @route GET /messages
   * @description Lista todas as mensagens do cliente autenticado, com opções de filtro.
   */
  @Get()
  @ApiOperation({
    summary: 'Lista todas as mensagens do cliente autenticado',
    description:
      'Retorna uma lista de todas as mensagens associadas ao cliente autenticado. Pode ser expandido para incluir filtros como ID da conversa ou tipo de mensagem.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de mensagens retornada com sucesso.',
    type: [Message],
  })
  @ApiResponse({
    status: 401,
    description:
      'Acesso não autorizado. O token de autenticação JWT é inválido ou não foi fornecido.',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor ao processar a requisição.',
  })
  async findAll(@GetUser() user: Client): Promise<Message[]> {
    this.logger.log(
      'Executando busca de todas as mensagens do cliente autenticado.',
    );
    return this.messagesService.findAll(user.id);
  }

  /**
   * @route GET /messages/:id
   * @description Obtém os detalhes de uma mensagem específica.
   * @param {string} id - O ID da mensagem.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtém detalhes de uma mensagem específica',
    description:
      'Retorna os detalhes de uma mensagem específica, identificado pelo seu ID. O cliente autenticado deve ter permissão para visualizar esta mensagem.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da mensagem a ser recuperada.',
    type: String,
    example: 'msg_a1b2c3d4e5f6a7b8c9d0', // Exemplo de ID de mensagem
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da mensagem retornados com sucesso.',
    type: Message,
  })
  @ApiResponse({
    status: 401,
    description:
      'Não autorizado. O cliente autenticado não tem permissão para acessar esta mensagem ou o token JWT é inválido.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Mensagem não encontrada. O ID da mensagem fornecido não corresponde a nenhuma mensagem existente ou o cliente não tem acesso a ela.',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor ao processar a requisição.',
  })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: Client,
  ): Promise<Message> {
    this.logger.log(`Executando busca da mensagem com ID: ${id}`);
    const message = await this.messagesService.findOne(id, user.id);
    if (!message) {
      throw new NotFoundException(
        `Mensagem com ID "${id}" não encontrada ou você não tem acesso.`,
      );
    }
    // A validação de acesso deve ser feita dentro do findOne do service,
    // garantindo que a mensagem pertence à conversa do usuário.
    return message;
  }

  /**
   * @route GET /messages/:id/status
   * @description Verifica o status de uma mensagem específica.
   * @param {string} id - O ID da mensagem.
   */
  @Get(':id/status')
  @ApiOperation({
    summary: 'Verifica o status de uma mensagem',
    description:
      'Retorna o status atual de uma mensagem específica (por exemplo, "enviada", "lida", "falha").',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da mensagem para verificar o status.',
    type: String,
    example: 'msg_a1b2c3d4e5f6a7b8c9d0', // Exemplo de ID de mensagem
  })
  @ApiResponse({
    status: 200,
    description: 'Status da mensagem retornado com sucesso.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'sent' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      'Acesso não autorizado. O token de autenticação JWT é inválido ou não foi fornecido.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Mensagem não encontrada. O ID da mensagem fornecido não corresponde a nenhuma mensagem existente.',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor ao processar a requisição.',
  })
  async findStatus(
    @Param('id') id: string,
    @GetUser() user: Client,
  ): Promise<{ status: string }> {
    this.logger.log(`Executando busca de status da mensagem com ID: ${id}`);
    const status = await this.messagesService.findStatus(id, user.id);

    if (!status) {
      throw new NotFoundException(
        `Status para mensagem com ID "${id}" não encontrado.`,
      );
    }
    return status;
  }
}
