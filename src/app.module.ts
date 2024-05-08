import { AuthModule } from '@common/auth/auth.module';
import { ConfigModule } from '@common/config/config.module';
import { MongooseModule } from '@nestjs/mongoose';

import { DatabaseModule } from './common/database/database.module';
import { ConfigService } from '@common/config/config.service';
import { Module } from '@nestjs/common';
import { FunctionModule } from './modules/functions/functions.module';
import { WorkflowsModule } from '@modules/workflows/workflows.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    FunctionModule,
    WorkflowsModule,
    DatabaseModule
  ],
})
export class AppModule {
  static port: string | number;
  static isDev: boolean;
  static globalPrefix: string;
  static config: ConfigService;
  static frontUrl: string;

  constructor(private readonly config: ConfigService) {
    AppModule.port = config.get('API_PORT');
    AppModule.globalPrefix = config.get('API_GLOBAL_PREFIX');
    AppModule.isDev = config.isDev;
    AppModule.config = config;
    AppModule.frontUrl = config.get('APP_FRONT_URL');
  }
}
