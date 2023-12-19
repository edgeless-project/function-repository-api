import { ConfigModule } from '@common/config/config.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Function, FunctionSchema } from './schemas/function.schema';
import { AdminFunctionController } from './controllers/admin-function.controller';
import { FunctionService } from './services/functions.service';
import { FunctionCode, FunctionCodeSchema } from './schemas/function-code.schema';
import { FunctionTempCode, FunctionTempCodeSchema } from './schemas/function-temp-code.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Function.name, schema: FunctionSchema }]), 
    MongooseModule.forFeature([{ name: FunctionCode.name, schema: FunctionCodeSchema }]), 
    MongooseModule.forFeature([{ name: FunctionTempCode.name, schema: FunctionTempCodeSchema }]), 
  ],
  controllers: [AdminFunctionController],
  providers: [FunctionService],
  exports: [MongooseModule],
})
export class FunctionModule {}
