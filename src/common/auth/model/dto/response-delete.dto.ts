import {ApiProperty} from "@nestjs/swagger";
import {IsDefined, IsNotEmpty} from "class-validator";

export class ResponseDeleteDto {
	@ApiProperty({
		example: '1',
		description: 'Number of elements deleted successfully.',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	elementsDeleted: number;
}