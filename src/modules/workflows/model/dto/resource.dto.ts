import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { Resource } from "../contract/resource.interface";

export class ResourceDto implements Resource {
	@ApiProperty({
		example: 'http-ingress',
		description: 'Resource name'
	})
	@IsOptional()
	name: string;

	@ApiProperty({
		example: 'http-ingress',
		description: 'Class type'
	})
	@IsOptional()
	class_type: string;

	@ApiProperty({
		example: '{ "new_request": "external_trigger" }',
		description: 'functions for the output mapping as a JSON object'
	})
	@IsOptional()
	output_mapping: any;

	@ApiProperty({
		example: '{ "host": "demo.edgeless-project.eu", "methods": "POST" }',
		description: 'configurations as a JSON object'
	})
	@IsOptional()
	configurations: any;

}