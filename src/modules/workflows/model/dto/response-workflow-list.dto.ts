import { ApiProperty } from "@nestjs/swagger";

class BasicWorkflowDto {
    @ApiProperty({
        example: 'test-workflow',
        description: 'The workflow name',
        required: true
    })
    name: string;
}

export class ResponseWorkflowListDto {
    @ApiProperty({ required: true })
    items: BasicWorkflowDto[];
    @ApiProperty({ required: true })
    total: number;
    @ApiProperty({ required: true })
    limit: number;
    @ApiProperty({ required: true })
    offset: number;
}