import {User, UserRole} from "@modules/users/model/contract/user.interface";
import {ApiProperty} from "@nestjs/swagger";
import {IsDefined, IsOptional} from "class-validator";

export class UpdateUserDto {

	@ApiProperty({
		example: 'email@email.com',
		description: 'The User email',
		type: String,
		required: true
	})
	@IsOptional()
	email: string;

	@ApiProperty({
		example: 'password',
		description: 'The User password',
		type: String,
		required: true
	})
	@IsOptional()
	password: string;

	@ApiProperty({
		example: 'FUNC_DEVELOPER',
		description: 'The User role',
		type: String,
		enum: UserRole,
		default: UserRole.AppDeveloper,
		required: true
	})
	@IsOptional()
	role: UserRole;
}