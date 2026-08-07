import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.useWebSocketAdapter(new WsAdapter(app));
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DockSight API')
    .setDescription(
      'Open-source Docker management and observability platform API',
    )
    .setVersion('0.1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Listen for SIGTERM/SIGINT so OnModuleDestroy hooks (Prisma, Redis) run on
  // docker compose stop / docksight update restarts.
  app.enableShutdownHooks();

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);

  // Host is deployment-dependent (container, reverse proxy, etc.) — log the
  // bound port rather than hardcoding localhost.
  logger.log(`DockSight API listening on port ${port}`);
  logger.log(`Swagger docs available at /api/docs (port ${port})`);
  logger.log(`Agent WebSocket endpoint at /agents (port ${port})`);
}

void bootstrap();
