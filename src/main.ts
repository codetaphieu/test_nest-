import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' });

  const config = new DocumentBuilder()
    .setTitle('NestJS API')
    .setDescription('My NestJS API documentation')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true
    }),
  );

  SwaggerModule.setup('api', app, document);

  await app.listen(Number(process.env.PORT || 3001));
}

bootstrap();
