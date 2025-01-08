import {ApiProperty} from "@nestjs/swagger";
import {UserDTO} from "@common/users/model/dto/user.dto";

export class ResponseUserDto extends UserDTO {

	@ApiProperty({
		example: '2024-01-20T06:57:25.563Z',
		description: 'Timestamp indicating when the record was initially created in the database.',
		required: true
	})
	createdAt: Date;

	@ApiProperty({
		example: '2024-02-12T10:02:45.123Z',
		description: 'Timestamp showing the most recent time the record was updated in the database.',
		required: true
	})
	updatedAt: Date;

}