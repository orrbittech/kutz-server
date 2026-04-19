import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const stripeWebhookPath = '/api/v1/webhooks/stripe';
  app.use(stripeWebhookPath, express.raw({ type: 'application/json' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  const corsOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? ['http://localhost:3000'];
  app.enableCors({ origin: corsOrigins, credentials: true });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ZodValidationPipe());

  // Swagger is opt-in: building the document scans every controller/DTO and
  // can allocate 60-120MB on small containers. Enable explicitly via env var.
  const swaggerEnabled =
    process.env.ENABLE_SWAGGER === 'true' ||
    process.env.NODE_ENV !== 'production';
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Kutz API')
      .setDescription('Salon MVP REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}

void bootstrap();
