import { Controller, Logger, Post, Body, Put, UseInterceptors, UploadedFile, Get, Param, Query, Delete, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiBadRequestResponse, ApiConsumes, ApiOkResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

import { WorkflowsService } from '../services/workflows.service';
import { WorkflowDto } from '../model/dto/workflow.dto';
import { CreateWorkflowDto } from '../model/dto/create-workflow.dto';
import { ResponseDeleteWorkflowDto } from '../model/dto/response-delete-workflow.dto';

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
  @ApiOkResponse({ type: WorkflowDto})
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  async createWorkflow(@Body() eventData: CreateWorkflowDto) {
    return this.workflowsService.createWorkflow(eventData, "admin");
  }

  @Put(':id')
  @ApiOperation({
    summary: '',
    description: 'This service updates a workflow by its id.'
  })
  @ApiOkResponse({ type: WorkflowDto})
  async updateWorkflow(@Body() eventData: CreateWorkflowDto, @Param('id') id: string) {
    return this.workflowsService.updateWorkflow(id, eventData, "admin");
  }

  @Delete(':id')
  @ApiOperation({
    summary: '',
    description: 'This service deletes an existing workflow by its id.'
  })
  @ApiOkResponse({ type: ResponseDeleteWorkflowDto})
  async deleteFunction(@Param('id') id: string) {
    return this.workflowsService.deleteWorkflow(id, 'admin');
  }

  @Get(':id')
  @ApiOperation({
    summary: '',
    description: 'This service gets a new workflow by its id.'
  })
  @ApiOkResponse({ type: WorkflowDto})
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  async getWorkflow(@Param('id') id: string) {
    return this.workflowsService.getWorkflow(id, "admin");
  }

}