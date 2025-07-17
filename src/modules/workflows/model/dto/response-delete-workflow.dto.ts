import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNotEmpty } from "class-validator";

export class ResponseDeleteWorkflowDto {
	@ApiProperty({
		example: 1,
		description: 'The number of workflows deleted',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	deletedCount: number;
}