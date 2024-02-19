import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNotEmpty, IsOptional } from "class-validator";

import { FunctionClassSpecification } from "../../contract/function/class-specification.interface";

export class FunctionClassSpecificationDto implements FunctionClassSpecification {
    @ApiProperty({
        example: 'RUST_WASM',
        description: 'The function type',
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    function_type: string;

    @ApiProperty({
        example: 'http_requestor',
        description: 'The function id',
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    id: string;

    @ApiProperty({
        example: '0.1',
        description: 'The version',
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    version: string;

    @ApiProperty({
        example: '652faf54465c2e7ec15facce',
        description: 'The code file id',
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    code_file_id: string;

    @ApiProperty({
        example: '["success_cb", "failure_cb"]',
        description: 'The output callbacks',
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    outputs: string[];

}