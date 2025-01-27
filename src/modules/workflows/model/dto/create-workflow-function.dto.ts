import { IsOptional } from "class-validator";
import { ObjectId } from "mongodb";
import {FunctionSimpleDto} from "@modules/workflows/model/dto/function-simple.dto";

export class CreateWorkflowFunctionDto extends FunctionSimpleDto{

    @IsOptional()
    _id: ObjectId;

}