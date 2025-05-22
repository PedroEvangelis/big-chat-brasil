import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from '@nestjs/class-validator';

@ValidatorConstraint({ async: false })
export class IsCpfOrCnpjConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false;
    }

    const cleanedValue = value.replace(/[^\d]/g, ''); // Remove caracteres não numéricos

    if (cleanedValue.length === 11) {
      return this.isValidCpf(cleanedValue);
    } else if (cleanedValue.length === 14) {
      return this.isValidCnpj(cleanedValue);
    }

    return false;
  }

  defaultMessage(args: ValidationArguments) {
    return 'O $property deve ser um CPF ou CNPJ válido.';
  }

  // --- Lógica de validação de CPF ---
  private isValidCpf(cpf: string): boolean {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;

    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }

    if (remainder !== parseInt(cpf.substring(9, 10))) {
      return false;
    }

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;

    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }

    if (remainder !== parseInt(cpf.substring(10, 11))) {
      return false;
    }

    return true;
  }

  // --- Lógica de validação de CNPJ ---
  private isValidCnpj(cnpj: string): boolean {
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }

    let sum = 0;
    let position = 5;

    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.substring(i, i + 1)) * position--;
      if (position < 2) {
        position = 9;
      }
    }

    let remainder = sum % 11;
    let digit = remainder < 2 ? 0 : 11 - remainder;

    if (digit !== parseInt(cnpj.substring(12, 13))) {
      return false;
    }

    sum = 0;
    position = 6;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.substring(i, i + 1)) * position--;
      if (position < 2) {
        position = 9;
      }
    }

    remainder = sum % 11;
    digit = remainder < 2 ? 0 : 11 - remainder;

    if (digit !== parseInt(cnpj.substring(13, 14))) {
      return false;
    }

    return true;
  }
}

export function IsCpfOrCnpj(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCpfOrCnpjConstraint,
    });
  };
}
