import {ApiProperty, getSchemaPath} from "@nestjs/swagger";
import { IsDefined, IsNotEmpty, IsOptional } from "class-validator";

import { Workflow } from "../contract/workflow.interface";
import { FunctionDto } from "./function.dto";
import { AnnotationDto } from "./annotation.dto";
import { ResourceDto } from "./resource.dto";
import {FunctionSimpleDto} from "@modules/workflows/model/dto/function-simple.dto";

export class WorkflowDto implements Workflow {

    @ApiProperty({
        description: 'The workflow name',
        type: [FunctionDto],
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'The workflow functions',
        isArray: true,
        oneOf:[
            {type: getSchemaPath(FunctionDto)},
            {type: getSchemaPath(FunctionSimpleDto)}
        ],
        required: true
    })
    @IsDefined()
    @IsNotEmpty()
    functions: any[];

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