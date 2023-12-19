import { Module } from '@nestjs/common';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';

import { ConfigModule } from '@common/config/config.module';
import { ConfigService } from '@common/config/config.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: `mongodb://${config.databaseHost}:${config.databasePort}/${config.databaseName}`
      }),
    }),
  ],
})
export class DatabaseModule {}
