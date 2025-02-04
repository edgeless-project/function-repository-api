import {ApiProperty} from "@nestjs/swagger";


export class ResponseResetPasswordDto {
	@ApiProperty({
		example: 'new-password',
		description: 'This string represents the new user password.',
		required: true,
	})
	newPassword: string;
}