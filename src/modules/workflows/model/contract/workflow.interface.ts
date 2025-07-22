import { Function } from "./function.intercafe";
import { Resource } from "./resource.interface";
import { Annotation } from "./annotation.interface";

export interface Workflow {
	name: string;
	functions: Function[];
	resources: Resource[];
	annotations: Annotation;
}