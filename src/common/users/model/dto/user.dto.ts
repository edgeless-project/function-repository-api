
import {ApiProperty} from "@nestjs/swagger";
import {IsDefined, IsNotEmpty} from "class-validator";
import {User} from "@common/users/model/contract/user.interface";


export class UserDTO implements User {
	@ApiProperty({
		example: 'user',
		description: 'The User name',
		type: String,
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	username: string;

	@ApiProperty({
		example: 'email@email.com',
		description: 'The User email',
		type: String,
		required: false
	})
	@IsDefined()
	email: string;

	@ApiProperty({
		example: 'password',
		description: 'The User password',
		type: String,
		required: true
	})
	@IsDefined()
	password: string;

}