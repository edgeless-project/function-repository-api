import {ApiProperty} from "@nestjs/swagger";
import {IsDefined, IsNotEmpty} from "class-validator";


export class ValidateUserDto {

	@ApiProperty({
		example: 'email@email.com',
		description: 'The user email address',
		type: String,
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	email: string;

	@ApiProperty({
		example: 'password',
		description: 'The user password',
		type: String,
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	password: string;
}
