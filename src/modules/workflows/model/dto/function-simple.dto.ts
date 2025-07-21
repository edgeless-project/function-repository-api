import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNotEmpty } from "class-validator";

import { FunctionAnnotationDto } from "@modules/functions/model/dto/function/function-annotation.dto";

export class FunctionSimpleDto {

	@ApiProperty({
		example: 'incr',
		description: 'The function name',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	name: string;

	@ApiProperty({
		example: 'http_requestor',
		description: 'The function class specification id',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	class_specification_id: string;

	@ApiProperty({
		example: '0.1',
		description: 'The function class specification version',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	class_specification_version: string;

	@ApiProperty({
		example: '{ "result": "double" }',
		description: 'The functions for the output mapping',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	output_mapping: any;

	@ApiProperty({
		description: 'The annotations for the function',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	annotations: FunctionAnnotationDto;

}