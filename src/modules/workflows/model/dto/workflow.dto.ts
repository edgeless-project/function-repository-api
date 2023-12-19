import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNotEmpty, IsOptional } from "class-validator";

import { Workflow } from "../contract/workflow.interface";
import { FunctionDto } from "./function.dto";
import { AnnotationDto } from "./annotation.dto";
import { ResourceDto } from "./resource.dto";

export class WorkflowDto implements Workflow {

    @ApiProperty({
        description: 'The workflow id',
        type: [FunctionDto],
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    id: string;

    @ApiProperty({
        description: 'The workflow functions',
        type: [FunctionDto],
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    functions: FunctionDto[];

    @ApiProperty({
        description: 'The workflow resources',
        type: [ResourceDto],
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    resources: ResourceDto[];

    @ApiProperty({
        description: 'The workflow annotations',
        type: [AnnotationDto],
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    annotations: AnnotationDto;

}