import {ApiProperty} from "@nestjs/swagger";
import {ApiKeyDTO} from "@common/auth/model/dto/apikey.dto";

export class ResponseCreateApikeyDto extends ApiKeyDTO {

	@ApiProperty({
		example: '00000001',
		description: 'String that represents the current ID of the API key.',
		required: true
	})
	id: string;

	@ApiProperty({
		example: '2024-01-20T06:57:25.563Z',
		description: 'Timestamp indicating when the record was initially created in the database.',
		required: true
	})
	createdAt: Date;

}