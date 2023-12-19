import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNotEmpty } from "class-validator";

import { FunctionClassSpecificationDto } from "./class-specification.dto";

export class ResponseFunctionDto extends FunctionClassSpecificationDto {
    @ApiProperty({
        example: '652e956327414066ebf42b2a',
        description: 'The function class id',
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    id: string;

}