import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNotEmpty } from "class-validator";

import { UpdateWorkflowDto } from "./update-workflow.dto";

export class CreateWorkflowDto extends UpdateWorkflowDto {

	@ApiProperty({
		example: 'test-workflow',
		description: 'The workflow name',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	name: string;

}