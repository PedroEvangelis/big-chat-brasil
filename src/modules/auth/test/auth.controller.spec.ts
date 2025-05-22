import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { LoginRequestDto, LoginResponseDto } from '../dto/login.dto';
import { Plan } from '../../../common/enums/Plan.enum';
import { Document } from '../../../common/enums/Document.enum';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    // Limpa os mocks antes de cada teste para garantir isolamento
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService, // Mocka a implementação
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('Deve existir o controller', () => {
    expect(authController).toBeDefined();
  });

  describe('login', () => {
    it('Deve retornar o JWT Token e os dados do cliente', async () => {
      const loginDto: LoginRequestDto = {
        documentId: '12345678000199',
        documentType: Document.CNPJ,
      };

      // Definimos o que o mockAuthService.login vai retornar
      const expectedResponse: LoginResponseDto = {
        token: 'fake-jwt-token',
        client: {
          id: 'some-client-id',
          name: 'Some Client Name',
          documentId: '12345678000199',
          documentType: Document.CNPJ,
          planType: Plan.PREPAID,
          balance: 100.0,
          active: true,
        },
      };
      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await authController.login(loginDto);

      // Verificações
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto); // Garante que o método do serviço foi chamado com os DTOs corretos

      expect(result).toBeDefined(); // Garante que algo foi retornado
      expect(typeof result).toBe('object'); // Garante que é um objeto

      expect(result).toHaveProperty('token');
      expect(typeof result.token).toBe('string'); // O nome da propriedade é 'accessToken' e não 'token'

      expect(result).toHaveProperty('client');
      expect(typeof result.client).toBe('object');
      expect(result.client).toHaveProperty('id');
      expect(result.client).toHaveProperty('name');

      expect(result.client.documentId).toBe(loginDto.documentId);

      //Garantir que o objeto seja igual do mock
      expect(result).toEqual(expectedResponse);
    });
  });
});
