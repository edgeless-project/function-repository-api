import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNotEmpty } from "class-validator";

import { Function } from "../contract/function.intercafe";
import { FunctionClassSpecificationDto } from "@modules/functions/model/dto/function/class-specification.dto";
import { FunctionAnnotationDto } from "@modules/functions/model/dto/function/function-annotation.dto";

export class FunctionDto implements Function {

	@ApiProperty({
		example: 'incr',
		description: 'The function name',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	name: string;

	@ApiProperty({
		description: 'The function class specification',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	class_specification: FunctionClassSpecificationDto;

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