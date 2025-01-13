import { ApiProperty } from "@nestjs/swagger";
import {FunctionClassSpecificationDto} from "@modules/functions/model/dto/function/class-specification.dto";

class BasicFunctionDto {
    @ApiProperty({
        example: 'http_requestor',
        description: 'The function id',
        required: true
    })
    id: string;

    @ApiProperty({
        example: '0.1',
        description: 'The latest version',
        required: true
    })
    version: string;

    @ApiProperty({
        example: 'RUST_WASM',
        description: 'The function type',
        required: true
    })
    function_type: string;

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

export class ResponseFunctionListDto {
    @ApiProperty({ required: true })
    items: FunctionClassSpecificationDto[];
    @ApiProperty({ required: true })
    total: number;
    @ApiProperty({ required: true })
    limit: number;
    @ApiProperty({ required: true })
    offset: number;
}