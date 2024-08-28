import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNotEmpty, IsOptional } from "class-validator";

export interface function_types {
    type: string;
    code_file_id: string;
}

export class UpdateFunctionDto  {
   @ApiProperty({
        example: '[{type: "RUST_WASM", code_file_id: "652faf54465c2e7ec15facce"}]',
        description: 'The function types and code file id per type',
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    function_types: function_types[];

    @ApiProperty({
        example: '["success_cb", "failure_cb"]',
        description: 'The output callbacks',
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    outputs: string[];

}