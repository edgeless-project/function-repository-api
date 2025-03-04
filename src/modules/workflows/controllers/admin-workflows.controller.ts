import { Controller, Logger, Post, Body, Put, Get, Param, Query, Delete } from '@nestjs/common';
import {ApiTags, ApiOperation, ApiConsumes, ApiOkResponse, ApiQuery, ApiBearerAuth} from '@nestjs/swagger';
import { WorkflowsService } from '@modules/workflows/services/workflows.service';
import { CreateWorkflowDto } from '@modules/workflows/model/dto/create-workflow.dto';
import { ResponseDeleteWorkflowDto } from '@modules/workflows/model/dto/response-delete-workflow.dto';
import { UpdateWorkflowDto } from '@modules/workflows/model/dto/update-workflow.dto';
import { OptionalParseIntPipe } from '@common/pipes/optional-parse-int.pipe';
import { ResponseWorkflowListDto } from '@modules/workflows/model/dto/response-workflow-list.dto';
import { ResponseWorkflowDto } from '@modules/workflows/model/dto/response-workflow.dto';
import {Roles} from "@common/decorators/roles.decorator";
import {UserRole} from "@modules/users/model/contract/user.interface";

@ApiBearerAuth()
@ApiTags('Admin')
@Controller('admin/workflow')
export class AdminWorkflowsController {
  private logger = new Logger('AdminWorkflowsController', { timestamp: true});

  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post('')
  @Roles(UserRole.ClusterAdmin, UserRole.AppDeveloper)
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
  @Roles(UserRole.ClusterAdmin, UserRole.AppDeveloper)
  @ApiOperation({
    summary: '',
    description: 'This service updates a workflow by its name.'
  })
  @ApiOkResponse({ type: ResponseWorkflowDto})
  async updateWorkflow(@Body() eventData: UpdateWorkflowDto, @Param('name') name: string) {
    return this.workflowsService.updateWorkflow(name, eventData, "admin");
  }

  @Delete(':name')
  @Roles(UserRole.ClusterAdmin, UserRole.AppDeveloper)
  @ApiOperation({
    summary: '',
    description: 'This service deletes an existing workflow by its name.'
  })
  @ApiOkResponse({ type: ResponseDeleteWorkflowDto})
  async deleteFunction(@Param('name') name: string) {
    return this.workflowsService.deleteWorkflow(name, 'admin');
  }

  @Get(':name')
  @Roles(UserRole.ClusterAdmin, UserRole.AppDeveloper)
  @ApiOperation({
    summary: '',
    description: 'This service gets a workflow by its name including the function class specification for each function. If exclude_class_specification is set to true, the function class specification will be omitted.'
  })
  @ApiOkResponse({ type: ResponseWorkflowDto})
  @ApiQuery({
    name: 'exclude_class_specification',
    required: false,
    type: Boolean,
  })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  async getWorkflow(
    @Param('name') name: string,
    @Query('exclude_class_specification') excludeClassSpecification: boolean = false,
  ) {
    return this.workflowsService.getWorkflow(name, excludeClassSpecification, "admin");
  }

  @Get('')
  @Roles(UserRole.ClusterAdmin, UserRole.AppDeveloper)
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