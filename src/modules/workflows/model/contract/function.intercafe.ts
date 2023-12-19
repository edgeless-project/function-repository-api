import { FunctionClassSpecification } from "@modules/functions/model/contract/function/class-specification.interface";
import { FunctionAnnotation } from "@modules/functions/model/contract/function/function-annotation.interface";

export interface Function {
    name: string;
    class_specification: FunctionClassSpecification;
    output_mapping: any;
    annotations: FunctionAnnotation;
};