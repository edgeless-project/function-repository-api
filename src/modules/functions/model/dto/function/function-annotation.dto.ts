import { ApiProperty } from "@nestjs/swagger";
import { FunctionAnnotation } from "../../contract/function/function-annotation.interface";
import { IsOptional } from "class-validator";

export class FunctionAnnotationDto implements FunctionAnnotation {
    @ApiProperty({
        example: '{ "maximum_latency": 30, "trusted_execution": "TEE" }',
        description: 'QoS annotations as a JSON object'
    })
    @IsOptional()
    qos: any;

    @ApiProperty({
        example: '{ "mean_input_throughput": 100, "max_input_throughput": 500 }',
        description: 'characteristics annotations as a JSON object'
    })
    @IsOptional()
    characteristics: any;

    @ApiProperty({
        example: '{ "PARAM1": "value 1", "PARAM2": "value 2" }',
        description: 'Env variables as a JSON object'
    })
    @IsOptional()
    env: any;
}