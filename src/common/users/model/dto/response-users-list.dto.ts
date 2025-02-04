import {UserDTO} from "@common/users/model/dto/user.dto";
import {ApiProperty} from "@nestjs/swagger";
import {IsDefined, IsNotEmpty} from "class-validator";
import {number} from "joi";


export class ResponseUsersListDTO {
	@ApiProperty({
		description: 'The list of users',
		required: true
	})
	@IsDefined()
	users: UserDTO[];

	@ApiProperty({
		example: '1',
		description: 'Number of users',
		type: number,
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	total: number;

	@ApiProperty({
		example: '5',
		description: 'Limit of users to get',
		type: number,
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	limit: number;

	@ApiProperty({
		example: '10',
		description: 'Offset from the start of the list',
		type: number,
		required: true
	})
	@IsDefined()
	@IsNotEmpty()
	offset: number;
}