import { ConfigModule } from '@common/config/config.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminWorkflowsController } from './controllers/admin-workflows.controller';
import { WorkflowsService } from './services/workflows.service';
import { Workflow, WorkflowSchema } from './schemas/workflow.schema';
import { FunctionModule } from '@modules/functions/functions.module';

@Module({
	imports: [
		ConfigModule,
		MongooseModule.forFeature([{ name: Workflow.name, schema: WorkflowSchema }]),
		FunctionModule
	],
	controllers: [AdminWorkflowsController],
	providers: [WorkflowsService],
	exports: [],
})
export class WorkflowsModule {}
