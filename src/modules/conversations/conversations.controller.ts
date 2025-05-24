import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoggerService } from '../../common/logger/logger.service';
import { ConversationsService } from './conversations.service';
import { Conversation } from './entities/conversation.entity';
import { Message } from '../messages/entities/message.entity';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { GetUser } from '../../common/decorators/user.decorator';
import { Client } from '../clients/entities/client.entity';

@ApiTags('conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(ConversationsController.name);
  }

  /**
   * @route GET /conversations
   * @description Lista todas as conversas do cliente autenticado.
   */
  @Get()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lista todas as conversas do cliente autenticado',
    description:
      'Retorna uma lista de todas as conversas associadas ao ID do cliente que está autenticado no sistema.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de conversas retornada com sucesso.',
    type: [Conversation],
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
  async findAll(@GetUser() user: Client): Promise<Conversation[]> {
    const clientId = user.id;
    this.logger.log(
      `Iniciando busca por todas as conversas para o cliente ID: ${clientId}.`,
    );
    try {
      const conversations = await this.conversationsService.findAll(clientId);
      this.logger.log(
        `Conversas encontradas para o cliente ID: ${clientId}. Total: ${conversations.length} conversas.`,
      );
      return conversations;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar conversas para o cliente ID: ${clientId}. Erro: ${error.message}`,
        error.stack,
      );
      throw error; // Re-lança a exceção para que o NestJS a trate
    }
  }

  /**
   * @route GET /conversations/:id
   * @description Obtém os detalhes de uma conversa específica.
   * @param {string} id - O ID da conversa.
   */
  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtém detalhes de uma conversa específica',
    description:
      'Retorna os detalhes de uma conversa específica, identificado pelo seu ID. O cliente autenticado deve ser o proprietário da conversa.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da conversa a ser recuperada.',
    type: String,
    example: 'a1b2c3d4e5f6a7b8c9d0e1f2',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da conversa retornados com sucesso.',
    type: Conversation,
  })
  @ApiResponse({
    status: 401,
    description:
      'Não autorizado. O cliente autenticado não tem permissão para acessar esta conversa ou o token JWT é inválido.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Conversa não encontrada. O ID da conversa fornecido não corresponde a nenhuma conversa existente.',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor ao processar a requisição.',
  })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: Client,
  ): Promise<Conversation> {
    const clientId = user.id;
    this.logger.log(
      `Iniciando busca da conversa com ID: ${id} para o cliente ID: ${clientId}.`,
    );
    try {
      const conversation = await this.conversationsService.findOne(id);

      if (!conversation) {
        this.logger.warn(`Conversa com ID "${id}" não encontrada.`);
        throw new NotFoundException(`Conversa com ID "${id}" não encontrada.`);
      }

      if (
        clientId !== conversation.clientId
        && clientId !== conversation.recipientId
      ) {
        this.logger.warn(
          `Tentativa de acesso não autorizado à conversa ID: ${id} pelo cliente ID: ${clientId}.`,
        );
        throw new UnauthorizedException(
          'Você não tem permissão para acessar esta conversa.',
        );
      }

      this.logger.log(
        `Conversa com ID: ${id} encontrada e acesso autorizado para o cliente ID: ${clientId}.`,
      );
      return conversation;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error; // Re-lança exceções específicas de forma transparente
      }
      this.logger.error(
        `Erro ao buscar conversa com ID: ${id} para o cliente ID: ${clientId}. Erro: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * @route GET /conversations/:id/messages
   * @description Obtém todas as mensagens de uma conversa específica.
   * @param {string} id - O ID da conversa.
   */
  @Get(':id/messages')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtém todas as mensagens de uma conversa',
    description:
      'Retorna uma lista de todas as mensagens associadas a uma conversa específica, identificada pelo seu ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da conversa para a qual as mensagens serão recuperadas.',
    type: String,
    example: 'a1b2c3d4e5f6a7b8c9d0e1f2',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de mensagens da conversa retornada com sucesso.',
    type: [Message],
  })
  @ApiResponse({
    status: 401,
    description:
      'Não autorizado. O cliente autenticado não tem permissão para acessar as mensagens desta conversa ou o token JWT é inválido.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Conversa não encontrada. O ID da conversa fornecido não corresponde a nenhuma conversa existente.',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor ao processar a requisição.',
  })
  async findMessages(
    @Param('id') id: string,
    @GetUser() user: Client,
  ): Promise<Message[]> {
    const clientId = user.id;
    this.logger.log(
      `Iniciando busca das mensagens para a conversa ID: ${id} pelo cliente ID: ${clientId}.`,
    );
    try {
      const conversation = await this.conversationsService.findOne(id);

      if (!conversation) {
        this.logger.warn(
          `Conversa com ID "${id}" não encontrada para buscar mensagens.`,
        );
        throw new NotFoundException(`Conversa com ID "${id}" não encontrada.`);
      }

      if (
        clientId !== conversation.clientId
        && clientId !== conversation.recipientId
      ) {
        this.logger.warn(
          `Tentativa de acesso não autorizado às mensagens da conversa ID: ${id} pelo cliente ID: ${clientId}.`,
        );
        throw new UnauthorizedException(
          'Você não tem permissão para acessar as mensagens desta conversa.',
        );
      }

      const messages = await this.conversationsService.findMessages(id);
      this.logger.log(
        `Mensagens encontradas para a conversa ID: ${id}. Total: ${messages.length} mensagens.`,
      );
      return messages;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao buscar mensagens para a conversa ID: ${id} pelo cliente ID: ${clientId}. Erro: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
