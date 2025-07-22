import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { Annotation } from "../contract/annotation.interface";

export class AnnotationDto implements Annotation {
	@ApiProperty({
		example: '{ "priority_class": 1, "maximum_latency": 30, "execution_rate": 2 }',
		description: 'QoS annotations as a JSON object'
	})
	@IsOptional()
	qos: any;

	@ApiProperty({
		example: '{ "average_invocation_rate": 4, "peak_invocation_rate": 15 }',
		description: 'characteristics annotations as a JSON object'
	})
	@IsOptional()
	characteristics: any;

}