import {ApiProperty} from "@nestjs/swagger";
import {IsDefined, IsNotEmpty} from "class-validator";


export class ResponseValidateUserDto{
	@ApiProperty({
		example: "username",
		description: 'The username to validate',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	username: string;

	@ApiProperty({
		example: true,
		description: 'True if the user data is correct. False otherwise.',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	validation: boolean;
}
