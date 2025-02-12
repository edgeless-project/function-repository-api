import {ApiProperty} from "@nestjs/swagger";
import {IsDefined, IsNotEmpty} from "class-validator";

export class ResponseLoginDto {
	@ApiProperty({
		example: '',
		description: 'Access token for user.',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	access_token: string;
}