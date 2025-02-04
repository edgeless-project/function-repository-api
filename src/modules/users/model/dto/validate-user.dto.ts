import {ApiProperty} from "@nestjs/swagger";
import {IsDefined, IsNotEmpty} from "class-validator";


export class ValidateUserDto {

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
