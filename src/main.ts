import 'module-alias/register';
import { NestFactory, Reflector } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { setupSwagger } from '@common/swagger';
import helmet from 'helmet';
import { AccessGuard } from '@common/guards/access.guard';
import { loggerMiddleware } from '@common/middlewares/logger.middleware';
import { TransformInterceptor } from '@common/interceptors/TransformInterceptor';
import bodyParser = require('body-parser');
import { AddressInfo } from 'net';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });
  const logger = new Logger('Main', { timestamp: true });

  app.setGlobalPrefix(AppModule.globalPrefix);

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

  app.use(loggerMiddleware);
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.useGlobalGuards(app.get(AccessGuard));

  // Allow CORS from the front URL
  app.enableCors({
    origin: AppModule.frontUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  setupSwagger(app, AppModule.config);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }));

  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(AppModule.port);

   // Log current url of app and documentation
  const address = app.getHttpServer().address() as AddressInfo;
  let baseUrl = address.address;
  if (baseUrl === '0.0.0.0' || baseUrl === '::') {
    baseUrl = 'localhost';
  }
  const url = `http://${baseUrl}:${AppModule.port}${AppModule.globalPrefix}`;
  logger.log(`Listening to ${url}`);
  if (AppModule.isDev) {
    logger.log(`API Documentation available at ${url}/docs`);
  }
}

bootstrap();
