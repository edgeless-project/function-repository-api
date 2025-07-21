import { ApiProperty } from "@nestjs/swagger";

export class ResponseUploadFunctionCodeDto {
	@ApiProperty({
		example: '652e956327414066ebf42b2a',
		description: 'The function code id',
		required: true
	})
	id: string;
}