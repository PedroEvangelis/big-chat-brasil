import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { LoggerService } from './common/Logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule, {
      bufferLogs: true,
  });

  const customLogger = app.get(LoggerService);
  app.useLogger(customLogger);
  
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Big Chat Brasil')
    .setDescription('API de mensagens')
    .setVersion('0.1')
    .addTag('auth', 'Autenticação')
    .addTag('clients', 'Clientes')
    .addBearerAuth()
    .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document); // acessível em /docs

  await app.listen(3000);
}
bootstrap();
