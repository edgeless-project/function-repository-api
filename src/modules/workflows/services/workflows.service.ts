import { HttpException, Injectable, InternalServerErrorException, Logger, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ConfigService } from '../../../common/config/config.service';
import { CreateWorkflowDto } from '../model/dto/create-workflow.dto';
import { Workflow, WorkflowDocument } from '../schemas/workflow.schema';
import { Function, FunctionDocument } from '@modules/functions/schemas/function.schema';
import { WorkflowDto } from '../model/dto/workflow.dto';
import { UpdateWorkflowDto } from '../model/dto/update-workflow.dto';


@Injectable()
export class WorkflowsService {
  private logger = new Logger('WorkflowsService', { timestamp: true});

  constructor(
    @InjectModel(Workflow.name) private readonly workflowModel: Model<WorkflowDocument>,
    @InjectModel(Function.name) private readonly functionModel: Model<FunctionDocument>
  ) {}

  async createWorkflow(workflowData: CreateWorkflowDto, owner: string) {

    // Check if there exists already a workflow with that name
    try {
      const resp = await this.workflowModel.exists({
        name: workflowData.name,
        owner
      });
      if (resp) {
        throw new Error('Workflow already exists');
      }
    } catch {
      const msg = `A workflow with the name: ${workflowData.name} and owner: ${owner} already exists.`
      this.logger.error('createWorkflow: ' + msg);
      throw new NotAcceptableException(msg);
    }

    const { name, functions, resources, annotations } = workflowData;

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
        name,
        owner,
        functions: functionsToCreate,
        resources,
        annotations
      };

      const result = await this.workflowModel.create(workflowToCreate);

      const responseBody = {
        name: result.name,
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

  async updateWorkflow(name: string, workflowData: UpdateWorkflowDto, owner: string) {

    const { functions, resources, annotations } = workflowData;

    // Check if the workflow exists
    let workflowPrev = null;
    try {
      workflowPrev = await this.workflowModel.findOne({
        name,
        owner
      }).exec();
      if (!workflowPrev) {
        throw new Error("The workflow doesn't exist, please create the workflow first");
      }
    } catch {
      const msg = `updateWorkflow: A workflow with the name: ${name} and owner: ${owner} doesn't exist.`;
      this.logger.error("updateWorkflow: " + msg);
      throw new NotAcceptableException(msg);
    }

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
          name,
          owner
        },
        { $set: {
          functions: functionsToUpdate,
          resources,
          annotations
        } },
        { new: true }
      );

      const responseBody = {
        name,
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

  async deleteWorkflow(name: string, owner: string) {
    try {
      const { deletedCount } = await this.workflowModel.deleteOne({ name, owner });

      return {
        deletedCount
      }
    } catch (err) {
      this.logger.error('deleteWorkflow: ', err);
      throw new InternalServerErrorException(err);
    }
  }

  async getWorkflow(name: string, owner: string) {
    try {
      const workflowData = await this.workflowModel.findOne({ name, owner });

      if (!workflowData) {
        throw new Error(`A workflow with the name: ${name} and owner:${owner} doesn't exist.`);
      }

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
        name,
        functions,
        resources: workflowData.resources,
        annotations: workflowData.annotations
      }

      this.logger.debug('createWorkflow: responseBody',responseBody);
      return responseBody;
      
    } catch (err) {
      this.logger.error('getWorkflow: ', err);
      throw new NotFoundException(err);
    }
  }

  async findWorkflows(offset: number, limit: number) {
    try {
      const total = await this.workflowModel.countDocuments().exec();
      const result = await this.workflowModel.find({}, { ['name']: 1, _id: 0 })
        .limit(limit)
        .skip(offset)
        .exec();

      const items = result.map(w => ({id: w.id}));

      return {
        items,
        total,
        limit,
        offset
      };
    } catch (err) {
      this.logger.error('findWorkflow: ', err);
      throw new InternalServerErrorException(err);
    }
  }

}