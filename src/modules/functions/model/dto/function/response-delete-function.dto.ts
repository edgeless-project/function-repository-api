import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNotEmpty } from "class-validator";

export class ResponseDeleteFunctionDto {
	@ApiProperty({
		example: 1,
		description: 'The number of function versions deleted',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	deletedCount: number;
}