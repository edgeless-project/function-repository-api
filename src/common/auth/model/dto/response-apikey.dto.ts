import {ApiProperty} from "@nestjs/swagger";
import {IsDefined, IsNotEmpty} from "class-validator";
import {ApiKeyDTO} from "@common/auth/model/dto/apikey.dto";

export class ResponseApikeyDto extends ApiKeyDTO{

	@ApiProperty({
		example: '',
		description: 'Date of creation of the API key.',
		required: false
	})
	@IsDefined()
	@IsNotEmpty()
	createdAt: Date

}