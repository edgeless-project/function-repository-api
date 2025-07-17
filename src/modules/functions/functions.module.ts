import { ConfigModule } from '@common/config/config.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Function, FunctionSchema } from './schemas/function.schema';
import { AdminFunctionController } from './controllers/admin-function.controller';
import { FunctionService } from './services/functions.service';
@Module({
	imports: [
		ConfigModule,
		MongooseModule.forFeature([{ name: Function.name, schema: FunctionSchema }]),
	],
	controllers: [AdminFunctionController],
	providers: [FunctionService],
	exports: [MongooseModule],
})
export class FunctionModule {}
