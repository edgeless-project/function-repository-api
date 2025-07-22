import {ApiProperty} from "@nestjs/swagger";
import {IsDefined, IsNotEmpty} from "class-validator";


export class ResponseValidateUserDto{
	@ApiProperty({
		example: "email@email.com",
		description: 'The email to validate',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	email: string;

	@ApiProperty({
		example: true,
		description: 'True if the user data is correct. False otherwise.',
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	validation: boolean;
}
