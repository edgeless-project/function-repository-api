import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNotEmpty, IsOptional } from "class-validator";

import { AnnotationDto } from "./annotation.dto";
import { ResourceDto } from "./resource.dto";
import { CreateWorkflowFunctionDto } from "./create-workflow-function.dto";

export class CreateWorkflowDto {

    @ApiProperty({
        description: 'The workflow functions',
        type: [CreateWorkflowFunctionDto],
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    functions: CreateWorkflowFunctionDto[];

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
        type:[AnnotationDto],
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    annotations: AnnotationDto;

}