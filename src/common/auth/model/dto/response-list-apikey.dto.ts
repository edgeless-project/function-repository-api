import {ApiProperty} from "@nestjs/swagger";
import {IsDefined, IsNotEmpty} from "class-validator";
import {ResponseApikeyDto} from "@common/auth/model/dto/response-apikey.dto";

export class ResponseListApikeyDto{
	@ApiProperty({
		example: '',
		description: 'List of API keys.',
		required: true
	})
	@IsDefined()
	items:  ResponseApikeyDto[];

	@ApiProperty({
		example: '10',
		description: 'Total number of api keys.',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	total: number;

	@ApiProperty({
		example: '10',
		description: 'Limit of API keys to get.',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	limit: number;

	@ApiProperty({
		example: '0',
		description: 'Offset of API keys to get from the start.',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	offset: number;



}