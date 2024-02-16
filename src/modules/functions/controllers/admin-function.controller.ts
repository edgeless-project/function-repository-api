import { Controller, Logger, Post, Body, Put, UseInterceptors, UploadedFile, Get, Param, Query, Delete, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiBadRequestResponse, ApiConsumes, ApiOkResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

import { FunctionService } from '../services/functions.service';
import { FunctionClassSpecificationDto } from '../model/dto/function/class-specification.dto';
import { ResponseFunctionDto } from '../model/dto/function/response-function.dto';
import { ResponseUploadFunctionCodeDto } from '../model/dto/function/response-upload-function-code.dto';
import { ResponseDeleteFunctionDto } from '../model/dto/function/response-delete-function.dto';
import { UpdateFunctionDto } from '../model/dto/function/update-function.dto';
import { ResponseFunctionVersionsDto } from '../model/dto/function/response-function-versions.dt';
import { OptionalParseIntPipe } from '@common/pipes/optional-parse-int.pipe';
import { ResponseFunctionListDto } from '../model/dto/function/response-function-list.dto';

@ApiTags('Admin')
@Controller('admin/function')
export class AdminFunctionController {
  private logger = new Logger('AdminFunctionController', { timestamp: true});

  constructor(private readonly functionService: FunctionService) {}

  @Post('')
  @ApiOperation({
    summary: '',
    description: 'This service creates a new function. To upload the code file you need to use the <i>/upload</i> service first, and copy the provided id.'
  })
  @ApiOkResponse({ type: FunctionClassSpecificationDto})
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  async createFunction(@Body() eventData: FunctionClassSpecificationDto) {
    return this.functionService.createFunction(eventData, 'admin');
  }

  @Put('/:id')
  @ApiOperation({
    summary: '',
    description: 'This service updates an existing function. To upload the new code file (if you want to upload a new code file) you need to use the <i>/upload</i> service first, and copy the provided id.'
  })
  @ApiQuery({
    name: 'version',
    required: true,
    type: String,
  })
  @ApiOkResponse({ type: FunctionClassSpecificationDto})
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  async updateFunction(
    @Body() eventData: UpdateFunctionDto,
    @Param('id') id: string,
    @Query('version') version: string = null
  ) {
    return this.functionService.updateFunction(id, version, eventData, 'admin');
  }

  @Delete('/:id')
  @ApiOperation({
    summary: '',
    description: 'This service deletes an existing function by its id. If the version is defined, it deletes the function with that version, if not it deletes all the existing versions of that function.'
  })
  @ApiOkResponse({ type: ResponseDeleteFunctionDto})
  @ApiQuery({
    name: 'version',
    required: false,
    type: String,
  })
  async deleteFunction(
    @Param('id') id: string,
    @Query('version') version: string = null
  ) {
    return this.functionService.deleteFunction(id, 'admin', version);
  }

  @Get('/:id')
  @ApiOperation({
    summary: '',
    description: 'This service returns an existing function by its id. If the version is defined, it returns the function with that version, if not it returns the latest version found.'
  })
  @ApiOkResponse({ type: FunctionClassSpecificationDto})
  @ApiQuery({
    name: 'version',
    required: false,
    type: String,
  })
  async getFunction(
    @Param('id') id: string,
    @Query('version') version: string = null
  ) {
    return this.functionService.getFunction(id, 'admin', version);
  }

  @Post('/upload')
  @ApiOperation({
    summary: '',
    description: 'This service uploads the code file of a function, and temporarily stores it. The rervice returns an id to be used when creating/updating the function.<br> If the function is not created/updated with the provided code file id before 1 hour, the code file will be deleted automatically.<br><br><strong>Please use this carefully, we do not have file type validation yet.</strong>'
  })
  @ApiOkResponse({ type: ResponseUploadFunctionCodeDto})
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFunctionCode(@UploadedFile() file: Express.Multer.File) {
    return this.functionService.saveFunctionCode(file);
  }

  @Get('/download/:id')
  @ApiOperation({
    summary: '',
    description: 'This service downloads the code file of a function from the code file id.'
  })
  async getFunctionCode(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.functionService.getFunctionCode(id);

    // Configure response to download
    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalname}"`);
    res.setHeader('Content-Type', doc.mimetype);

    // Send data
    const code = Buffer.from(doc.code.buffer, 'base64');
    res.end(code);
  }

  @Get('/:id/versions')
  @ApiOperation({
    summary: '',
    description: 'This service returns the list of existing versions of a function.'
  })
  @ApiOkResponse({ type: ResponseFunctionVersionsDto})
  async getFunctionVersions(
    @Param('id') id: string
  ) {
    return this.functionService.getFunctionVersions(id, 'admin');
  }

  @Get('')
  @ApiOperation({
    summary: '',
    description: 'This service gets the list of available functions with pagination (by using limit and offset query params), by default limit=10, offset=0. The service also returns the total number of functions (total attribute).'
  })
  @ApiOkResponse({ type: ResponseFunctionListDto})
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
  async findFunctions(
    @Query('offset', new OptionalParseIntPipe('0')) offset: number,
    @Query('limit', new OptionalParseIntPipe('10')) limit: number
  ) {
    return this.functionService.findFunctions(offset, limit);
  }
}