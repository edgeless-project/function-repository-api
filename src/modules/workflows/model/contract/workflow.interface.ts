import { Function } from "./function.intercafe";
import { Resource } from "./resource.interface";
import { Annotation } from "./annotation.interface";

export interface Workflow {
    id?: string;
    functions: Function[];
    resources: Resource[];
    annotations: Annotation;
}