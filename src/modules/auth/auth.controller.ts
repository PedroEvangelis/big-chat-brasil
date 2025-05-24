import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequestDto, LoginResponseDto } from './dto/login.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoggerService } from '../../common/logger/logger.service';

/**
 * Controller responsável pela autenticação de usuários.
 *
 * @remarks
 * Este controller gerencia o processo de login, autenticando clientes
 * e retornando um token de acesso junto com os dados do cliente.
 */
@ApiTags('auth') // Adiciona uma tag para agrupar as rotas no Swagger UI
@Controller('auth')
export class AuthController {
  /**
   * Construtor do AuthController.
   * @param authService O serviço de autenticação injetado.
   */
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService,
  ) {
    //Configuração de contexto
    this.logger.setContext(AuthController.name);
  }

  /**
   * Realiza o processo de login de um cliente.
   *
   * @param loginDto Os dados de requisição para o login, contendo o `documentId` (CPF/CNPJ).
   * @returns Uma Promise que resolve para um objeto `LoginResponseDto`
   * contendo os dados do cliente e o token de acesso.
   */
  @Post()
  @ApiOperation({ summary: 'Realiza o login de um cliente' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Cliente não encontrado ou inativo',
  })
  async login(@Body() loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    this.logger.log(
      `Fazendo login: ${loginDto.documentType} ${loginDto.documentId}`,
    );

    try {
      const response = await this.authService.login(loginDto);

      this.logger.log(`Cliente logado com sucesso: ${response.client.name}`);

      return response;
    } catch (error) {
      this.logger.log(`Falha ao realizar login: ${error.message}}`);
      throw error;
    }
  }
}
