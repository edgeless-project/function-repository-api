import {ApiProperty} from "@nestjs/swagger";
import {ApiKey} from "@common/auth/model/interfaces/apikey.interface";

export class ApiKeyDTO implements ApiKey{
	@ApiProperty({
		example: 'asdfghjklñzxcvpbnmqwe1234567890',
		description: 'String that validates the identity of to the API.',
		required: true
	})
	key: string;

	@ApiProperty({
		example: 'User',
		description: 'String representing the user that created the API Key.',
		required: false
	})
	owner: string;
}