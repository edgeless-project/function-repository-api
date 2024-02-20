import { Controller, Logger, Post, Body, Put, UseInterceptors, UploadedFile, Get, Param, Query, Delete, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiBadRequestResponse, ApiConsumes, ApiOkResponse, ApiBody, ApiQuery } from '@nestjs/swagger';

import { WorkflowsService } from '../services/workflows.service';
import { WorkflowDto } from '../model/dto/workflow.dto';
import { CreateWorkflowDto } from '../model/dto/create-workflow.dto';
import { ResponseDeleteWorkflowDto } from '../model/dto/response-delete-workflow.dto';
import { UpdateWorkflowDto } from '../model/dto/update-workflow.dto';
import { OptionalParseIntPipe } from '@common/pipes/optional-parse-int.pipe';
import { ResponseWorkflowListDto } from '../model/dto/response-workflow-list.dto';
import { ResponseWorkflowDto } from '../model/dto/response-workflow.dto';

@ApiTags('Admin')
@Controller('admin/workflow')
export class AdminWorkflowsController {
  private logger = new Logger('AdminWorkflowsController', { timestamp: true});

  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post('')
  @ApiOperation({
    summary: '',
    description: 'This service creates a new workflow.'
  })
  @ApiOkResponse({ type: ResponseWorkflowDto})
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  async createWorkflow(@Body() eventData: CreateWorkflowDto) {
    return this.workflowsService.createWorkflow(eventData, "admin");
  }

  @Put(':name')
  @ApiOperation({
    summary: '',
    description: 'This service updates a workflow by its name.'
  })
  @ApiOkResponse({ type: ResponseWorkflowDto})
  async updateWorkflow(@Body() eventData: UpdateWorkflowDto, @Param('name') name: string) {
    return this.workflowsService.updateWorkflow(name, eventData, "admin");
  }

  @Delete(':name')
  @ApiOperation({
    summary: '',
    description: 'This service deletes an existing workflow by its name.'
  })
  @ApiOkResponse({ type: ResponseDeleteWorkflowDto})
  async deleteFunction(@Param('name') name: string) {
    return this.workflowsService.deleteWorkflow(name, 'admin');
  }

  @Get(':name')
  @ApiOperation({
    summary: '',
    description: 'This service gets a new workflow by its name.'
  })
  @ApiOkResponse({ type: ResponseWorkflowDto})
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  async getWorkflow(@Param('name') name: string) {
    return this.workflowsService.getWorkflow(name, "admin");
  }

  @Get('')
  @ApiOperation({
    summary: '',
    description: 'This service gets the list of available workflows with pagination (by using limit and offset query params), by default limit=10, offset=0. The service also returns the total number of workflows (total attribute).'
  })
  @ApiOkResponse({ type: ResponseWorkflowListDto})
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
  })
  async findWorkflows(
    @Query('offset', new OptionalParseIntPipe('0')) offset: number,
    @Query('limit', new OptionalParseIntPipe('10')) limit: number
  ) {
    return this.workflowsService.findWorkflows(offset, limit);
  }

}