import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@common/config/config.service';

export const setupSwagger = (app: INestApplication, config: ConfigService) => {
  const options = new DocumentBuilder()
    .setTitle(config.get('SWAGGER_API_NAME'))
    .setDescription(config.get('SWAGGER_API_DESCRIPTION'))
    .setVersion(config.get('SWAGGER_API_CURRENT_VERSION'))
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(config.get('SWAGGER_API_ROOT'), app, document);
};
