import { ApiProperty } from "@nestjs/swagger";

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
}

export class ResponseFunctionListDto {
    @ApiProperty({ required: true })
    items: BasicFunctionDto[];
    @ApiProperty({ required: true })
    total: number;
    @ApiProperty({ required: true })
    limit: number;
    @ApiProperty({ required: true })
    offset: number;
}