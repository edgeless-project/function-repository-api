import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNotEmpty, IsOptional } from "class-validator";
import {FunctionType} from "../../contract/function/class-specification.interface";

export class UpdateFunctionDto  {
   @ApiProperty({
        example: [{type: "RUST_WASM", code_file_id: "652faf54465c2e7ec15facce"}],
        description: 'The function types and code file id per type',
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    function_types: FunctionType[];

    @ApiProperty({
        example: '["success_cb", "failure_cb"]',
        description: 'The output callbacks',
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    outputs: string[];

}