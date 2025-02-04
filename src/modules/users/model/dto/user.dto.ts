
import {ApiProperty} from "@nestjs/swagger";
import {IsDefined, IsNotEmpty} from "class-validator";
import {User, UserRole} from "@modules/users/model/contract/user.interface";


export class UserDTO implements User {
	@ApiProperty({
		example: '00000001',
		description: 'The User id',
		type: String,
		required: true
	})
	@IsDefined()
	id: string;

	@ApiProperty({
		example: 'email@email.com',
		description: 'The User email',
		type: String,
		required: false
	})
	@IsDefined()
	@IsNotEmpty()
	email: string;

	@ApiProperty({
		example: 'password',
		description: 'The User password',
		type: String,
		required: false
	})
	@IsDefined()
	password: string;

	@ApiProperty({
		example: 'FUNC_DEVELOPER',
		description: 'The User role',
		type: String,
		enum: UserRole,
		default: UserRole.AppDeveloper,
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	role: UserRole;
}