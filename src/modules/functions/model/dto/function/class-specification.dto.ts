import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNotEmpty, IsOptional } from "class-validator";

import {function_types, FunctionClassSpecification} from "../../contract/function/class-specification.interface";

export class FunctionClassSpecificationDto implements FunctionClassSpecification {

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
        example: '["success_cb", "failure_cb"]',
        description: 'The output callbacks',
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    outputs: string[];

    @ApiProperty({
        example: '[ {"type": "RUST_WASM", "code_file_id": "652faf54465c2e7ec15facce"} ]',
        description: 'An array containing the type of function and the code file id linked to that function',
        required:true
    })
    @IsDefined()
    @IsNotEmpty()
    function_types: function_types[];

}