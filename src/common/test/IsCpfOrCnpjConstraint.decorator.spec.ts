import { IsCpfOrCnpjConstraint } from '../decorators/IsCpfOrCnpjConstraint.decorator';
import { ValidationArguments } from '@nestjs/class-validator';

describe('IsCpfOrCnpjConstraint', () => {
  let validator: IsCpfOrCnpjConstraint;

  beforeEach(() => {
    validator = new IsCpfOrCnpjConstraint();
  });

  it('deve ser definido', () => {
    expect(validator).toBeDefined();
  });

  // --- Testes para a validação de CPF ---
  describe('Validação de CPF', () => {
    it('deve retornar true para um CPF válido (com e sem formatação)', () => {
      // CPF válido real (apenas para teste, não deve ser usado em produção)
      const validCpf = '03538727171';
      const validCpfFormatted = '035.387.271-71';

      expect(validator.validate(validCpf, {} as ValidationArguments)).toBe(
        true,
      );
      expect(
        validator.validate(validCpfFormatted, {} as ValidationArguments),
      ).toBe(true);
    });

    it('deve retornar false para um CPF com comprimento diferente de 11', () => {
      expect(validator.validate('1234567890', {} as ValidationArguments)).toBe(
        false,
      ); // 10 dígitos
      expect(
        validator.validate('123456789012', {} as ValidationArguments),
      ).toBe(false); // 12 dígitos
    });

    it('deve retornar false para um CPF com todos os dígitos iguais', () => {
      expect(validator.validate('00000000000', {} as ValidationArguments)).toBe(
        false,
      );
      expect(validator.validate('11111111111', {} as ValidationArguments)).toBe(
        false,
      );
      expect(validator.validate('22222222222', {} as ValidationArguments)).toBe(
        false,
      );
    });

    it('deve retornar false para um CPF inválido (dígitos verificadores incorretos)', () => {
      // CPF com um dígito verificador incorreto
      const invalidCpf = '11122233344'; // Último dígito alterado do CPF válido '11122233345'
      expect(validator.validate(invalidCpf, {} as ValidationArguments)).toBe(
        false,
      );

      const invalidCpf2 = '98765432101'; // Exemplo genérico
      expect(validator.validate(invalidCpf2, {} as ValidationArguments)).toBe(
        false,
      );
    });
  });

  describe('Validação de CNPJ', () => {
    it('deve retornar true para um CNPJ válido (com e sem formatação)', () => {
      // CNPJ válido real (apenas para teste, não deve ser usado em produção)
      const validCnpj = '54231943000154';
      const validCnpjFormatted = '27.431.531/0001-95';

      expect(validator.validate(validCnpj, {} as ValidationArguments)).toBe(
        true,
      );
      expect(
        validator.validate(validCnpjFormatted, {} as ValidationArguments),
      ).toBe(true);
    });

    it('deve retornar false para um CNPJ com comprimento diferente de 14', () => {
      expect(
        validator.validate('1234567890123', {} as ValidationArguments),
      ).toBe(false); // 13 dígitos
      expect(
        validator.validate('123456789012345', {} as ValidationArguments),
      ).toBe(false); // 15 dígitos
    });

    it('deve retornar false para um CNPJ com todos os dígitos iguais', () => {
      expect(
        validator.validate('00000000000000', {} as ValidationArguments),
      ).toBe(false);
      expect(
        validator.validate('11111111111111', {} as ValidationArguments),
      ).toBe(false);
      expect(
        validator.validate('99999999999999', {} as ValidationArguments),
      ).toBe(false);
    });

    it('deve retornar false para um CNPJ inválido (dígitos verificadores incorretos)', () => {
      // CNPJ com um dígito verificador incorreto
      const invalidCnpj = '11222333000180'; // Último dígito alterado do CNPJ válido '11222333000181'
      expect(validator.validate(invalidCnpj, {} as ValidationArguments)).toBe(
        false,
      );

      const invalidCnpj2 = '12345678000100'; // Exemplo genérico
      expect(validator.validate(invalidCnpj2, {} as ValidationArguments)).toBe(
        false,
      );
    });
  });

  describe('Tipos de entrada inválidos', () => {
    it('deve retornar false para entrada que não seja string', () => {
      expect(validator.validate(12345678901, {} as ValidationArguments)).toBe(
        false,
      );
      expect(validator.validate(null, {} as ValidationArguments)).toBe(false);
      expect(validator.validate(undefined, {} as ValidationArguments)).toBe(
        false,
      );
      expect(validator.validate({}, {} as ValidationArguments)).toBe(false);
      expect(validator.validate([], {} as ValidationArguments)).toBe(false);
    });
  });
});
