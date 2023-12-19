import { HttpException, Injectable, InternalServerErrorException, Logger, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ConfigService } from '../../../common/config/config.service';
import { CreateWorkflowDto } from '../model/dto/create-workflow.dto';
import { Workflow, WorkflowDocument } from '../schemas/workflow.schema';
import { Function, FunctionDocument } from '@modules/functions/schemas/function.schema';
import { WorkflowDto } from '../model/dto/workflow.dto';


@Injectable()
export class WorkflowsService {
  private logger = new Logger('WorkflowsService', { timestamp: true});

  constructor(
    @InjectModel(Workflow.name) private readonly workflowModel: Model<WorkflowDocument>,
    @InjectModel(Function.name) private readonly functionModel: Model<FunctionDocument>
  ) {}

  async createWorkflow(workflowData: CreateWorkflowDto, owner: string) {

    const { functions, resources, annotations } = workflowData;

    // Extract function _ids
    for (let i = 0; i < functions.length; i++) {

      // Get and validate the function ids and versions exist
      const {class_specification_id, class_specification_version} = functions[i];
      const functionData = await this.functionModel.findOne({
        id: class_specification_id, 
        version: class_specification_version,
        owner
      }).exec();

      if (!functionData) {
        const msg = `A function with the id: ${class_specification_id}, version: ${class_specification_version} and owner: ${owner} doesn't exist.`;
        this.logger.error('createWorkflow: ', msg);
        throw new NotFoundException(msg);
      }
      functions[i]._id = functionData._id;
      
    }

    try {
      const functionsToCreate = functions.map(func => ({
        name: func.name,
        class_specification: func._id,
        output_mapping: func.output_mapping,
        annotations: func.annotations
      }));
  
      const workflowToCreate = {
        owner,
        functions: functionsToCreate,
        resources,
        annotations
      };

      const result = await this.workflowModel.create(workflowToCreate);

      const responseBody = {
        id: result._id.toString(),
        functions: result.functions,
        resources: result.resources,
        annotations: result.annotations
      };

      this.logger.debug('createWorkflow: responseBody',responseBody);

      return responseBody;

    } catch (err) {
      this.logger.error('createWorkflow: ', err);
      throw new InternalServerErrorException();
    }

  }

  async updateWorkflow(id: string, workflowData: CreateWorkflowDto, owner: string) {

    const { functions, resources, annotations } = workflowData;

    // Extract function _ids
    for (let i = 0; i < functions.length; i++) {

      // Get and validate the function ids and versions exist
      const {class_specification_id, class_specification_version} = functions[i];
      const functionData = await this.functionModel.findOne({
        id: class_specification_id, 
        version: class_specification_version,
        owner
      }).exec();

      if (!functionData) {
        const msg = `A function with the id: ${class_specification_id}, version: ${class_specification_version} and owner: ${owner} doesn't exist.`;
        this.logger.error('createWorkflow: ', msg);
        throw new NotFoundException(msg);
      }
      functions[i]._id = functionData._id;
      
    }

    try {
      const functionsToUpdate = functions.map(func => ({
        name: func.name,
        class_specification: func._id,
        output_mapping: func.output_mapping,
        annotations: func.annotations
      }));

      const result = await this.workflowModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(id)
        },
        { $set: {
          functions: functionsToUpdate,
          resources,
          annotations
        } },
        { new: true }
      );

      const responseBody = {
        id,
        functions: result.functions,
        resources: result.resources,
        annotations: result.annotations
      };

      this.logger.debug('updateWorkflow: responseBody',responseBody);

      return responseBody;

    } catch (err) {
      this.logger.error('updateWorkflow: ', err);
      throw new InternalServerErrorException();
    }

  }

  async deleteWorkflow(id: string, owner: string) {
    try {
      const { deletedCount } = await this.workflowModel.deleteOne({ _id: new Types.ObjectId(id) });

      return {
        deletedCount
      }
    } catch (err) {
      this.logger.error('deleteFunction: ', err);
      throw new InternalServerErrorException(err);
    }
  }

  async getWorkflow(id: string, owner: string) {
    try {
      const workflowData = await this.workflowModel.findOne({ _id: new Types.ObjectId(id) });

      let functions = [];
      for (let i = 0; i < workflowData.functions.length; i++) {
        const func = workflowData.functions[i];
        const {
          function_type, 
          id, 
          version, 
          code_file_id, 
          output_callbacks 
        } = await this.functionModel.findOne({ _id: func.class_specification });
        functions.push({
          name: func.name,
          class_specification: {
            function_type, 
            id, 
            version, 
            code_file_id, 
            output_callbacks 
          },
          output_mapping: func.output_mapping,
          annotations: func.annotations
        });
      }

      const responseBody = {
        id: workflowData._id.toString(),
        functions,
        resources: workflowData.resources,
        annotations: workflowData.annotations
      }

      this.logger.debug('createWorkflow: responseBody',responseBody);
      return responseBody;
      
    } catch (err) {
      this.logger.error('getWorkflow: ', err);
      throw new InternalServerErrorException();
    }
  }

}