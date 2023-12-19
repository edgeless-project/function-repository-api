import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNotEmpty } from "class-validator";

export class ResponseFunctionVersionsDto {
    @ApiProperty({
        example: [
            '0.1',
            '1.0'
        ],
        description: 'The function versions',
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    versions: string[];

}