import {ApiProperty} from "@nestjs/swagger";
import {IsDefined} from "class-validator";
import {UserDTO} from "@modules/users/model/dto/user.dto";

export class ResponseDeleteUserDto {
	@ApiProperty({
		description: 'The number of users deleted',
		required: true,
		type: Number,
	})
	@IsDefined()
	count: number;
}