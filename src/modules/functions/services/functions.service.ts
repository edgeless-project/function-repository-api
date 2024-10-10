import { HttpException, Injectable, InternalServerErrorException, Logger, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {Model, PipelineStage, Types} from 'mongoose';

import { FunctionClassSpecificationDto } from '../model/dto/function/class-specification.dto';
import { Function, FunctionDocument } from '../schemas/function.schema';
import { FunctionCode, FunctionCodeDocument } from '../schemas/function-code.schema';
import { FunctionTempCode, FunctionTempCodeDocument } from '../schemas/function-temp-code.schema';
import { ResponseFunctionDto } from '../model/dto/function/response-function.dto';
import { ResponseUploadFunctionCodeDto } from '../model/dto/function/response-upload-function-code.dto';
import { ResponseDeleteFunctionDto } from '../model/dto/function/response-delete-function.dto';
import { UpdateFunctionDto } from '../model/dto/function/update-function.dto';
import { ResponseFunctionVersionsDto } from '../model/dto/function/response-function-versions.dt';
import { ResponseFunctionListDto } from '../model/dto/function/response-function-list.dto';
import {function_types} from "@modules/functions/model/contract/function/class-specification.interface";


@Injectable()
export class FunctionService {
  private logger = new Logger('FunctionService', { timestamp: true});

  constructor(
    @InjectModel(Function.name) private readonly functionModel: Model<FunctionDocument>,
    @InjectModel(FunctionCode.name) private readonly functionCodeModel: Model<FunctionCodeDocument>,
    @InjectModel(FunctionTempCode.name) private readonly functionTempCodeModel: Model<FunctionTempCodeDocument>,
  ) {}

  async createFunction(functionData: FunctionClassSpecificationDto, owner: string): Promise<ResponseFunctionDto> {

    if (!functionData.function_types) {
      this.logger.error('createFunction: code_file_id and type not provided');
      throw new NotAcceptableException('Function types not provided');
    }

    let function_types:function_types[] = [];
    let lastCreated = {
      createdAt: Date.prototype,
      updatedAt : Date.prototype,
    }

    // Check if there exists already a function with that id and version
    try {
      const resp = await this.functionModel.exists({
        id: functionData.id,
        version: functionData.version,
        owner
      });
      if (resp) {
        throw new Error('Function already exists');
      }
    } catch {
      const msg = `A function with the id: ${functionData.id}, version: ${functionData.version} and owner: ${owner} already exists.`
      this.logger.error('createFunction: ' + msg);
      throw new NotAcceptableException(msg);
    }

    for (const t of functionData.function_types) {
      if (!t.code_file_id) {
        this.logger.error('createFunction: code_file_id not provided');
        throw new NotAcceptableException('code_file_id not provided');
      }
      if (!t.type) {
        this.logger.error('createFunction: type not provided');
        throw new NotAcceptableException('type not provided');
      }

      // Check if the code file exists in the temp collection and get it
      let tempCodeFile = null;
      try {
        tempCodeFile = await this.functionTempCodeModel.findById(t.code_file_id);
        if (!tempCodeFile) throw new Error();
      } catch (err) {
        const msg = "There isn't a function code with the provided code_file_id";
        this.logger.error("createFunction: " + msg);
        throw new NotAcceptableException(msg);
      }

      // Copy the temp code file from the temp collection to the stable collection
      try {
        await this.functionCodeModel.create({
          mimetype: tempCodeFile.mimetype,
          originalname: tempCodeFile.originalname,
          code: tempCodeFile.code,
          _id: tempCodeFile._id
        });

        await this.functionTempCodeModel.deleteOne(tempCodeFile._id);
      } catch (err) {
        this.logger.error('createFunction: Server error', err);
        throw new InternalServerErrorException('Server error');
      }
      // Create the function class
      try {
        const {
          function_type,
          id,
          version,
          code_file_id,
          outputs,
          createdAt,
          updatedAt,
          _id
        } = await this.functionModel.create({
          owner:owner,
          id: functionData.id,
          version: functionData.version,
          code_file_id: t.code_file_id,
          function_type: t.type,
          outputs: functionData.outputs,
        });

        function_types.push({code_file_id: code_file_id, type: function_type});
        lastCreated.createdAt = createdAt;
        lastCreated.updatedAt = updatedAt;

      } catch (err) {
        this.logger.error('createFunction: Server error', err);
        throw new InternalServerErrorException('Server error');
      }
    }
    const responseBody = {
      id: functionData.id,
      version: functionData.version,
      function_types: function_types,
      createdAt: lastCreated.createdAt,
      updatedAt: lastCreated.updatedAt,
      outputs: functionData.outputs
    }

    this.logger.debug('createFunction: responseBody', responseBody);
    return responseBody;
  }

  async saveFunctionCode(file: Express.Multer.File): Promise<ResponseUploadFunctionCodeDto> {

    if (!file) {
      this.logger.error('createFunction: File not provided');
      throw new NotAcceptableException('File not provided');
    }

    // TODO: Type validation

    // Size validation (max 16MB)
    if(!file.size || file.size > 16777216) {
      this.logger.error('createFunction: File size exceeds the limit (16MB)');
      throw new NotAcceptableException('File size exceeds the limit (16MB)');
    }

    try {
      const { _id } = await this.functionTempCodeModel.create({
        mimetype: file.mimetype,
        originalname: file.originalname,
        code: file.buffer,
        createdAt: new Date()
      });

      const responseBody = {
        id: _id.toString()
      };

      this.logger.debug('createFunction: responseBody',responseBody);
      return responseBody;
    } catch (err) {
      this.logger.error('createFunction: Server error', err);
      throw new InternalServerErrorException('Server error');
    }

  }

  async updateFunction(id: string, version: string, functionData: UpdateFunctionDto, owner: string): Promise<ResponseFunctionDto> {

    let stored_types:function_types[] = [];
    let responseBody = {
      id: id,
      version: version,
      function_types: functionData.function_types,
      createdAt: null,
      updatedAt: null,
      outputs: functionData.outputs
    }

    //Get existing types for function
    let resp = await this.functionModel.find({ id, version, owner }).lean().exec();
    if (!resp) {
      throw new Error(`updateFunction: A function with the id: ${id}, version: ${version} and owner: ${owner} doesn't exist.`);
    }
    for (const f of resp) {
      stored_types.push({type:f.function_type, code_file_id: f.code_file_id});
    }

    // Delete expired function types that are on db but not on update request
    if (stored_types.length > functionData.function_types.length) {
      let typesReq = [];
      functionData.function_types.forEach(t => {typesReq.push(t.type)});
      stored_types.forEach(t => {
        if (!typesReq.includes(t.type)){
          this.deleteFunction(id, owner, version, t.type);
        }
      });
    }

    //  Create new function types
    else if (stored_types.length < functionData.function_types.length) {
      let typesReq = [];
      functionData.function_types.forEach(t => {typesReq.push(t.type)});
      for (const t of stored_types) {
        if (!typesReq.includes(t.type)){
          // Create the function class
          try {
            const {
              _id
            } = await this.functionModel.create({
              owner:owner,
              id: id,
              version: version,
              code_file_id: t.code_file_id,
              function_type: t.type,
              outputs: functionData.outputs,
            });

          } catch (err) {
            this.logger.error('updateFunction: Server error on create function', err);
            throw new InternalServerErrorException('Server error');
          }
        }
      }
    }

    //Output check
    if (!functionData.outputs) {
      const msg = 'Output not provided';
      this.logger.error('updateFunction: ' + msg);
      throw new NotAcceptableException(msg);
    }

    //Update existing files
    stored_types = [];
    for (const function_type of functionData.function_types) {

      if (!function_type.code_file_id) {
        const msg = 'code_file_id not provided';
        this.logger.error('updateFunction: ' + msg);
        throw new NotAcceptableException(msg);
      }
      if (!function_type.type) {
        const msg = 'type not provided';
        this.logger.error('updateFunction: ' + msg);
        throw new NotAcceptableException(msg);
      }

      const type = function_type.type;
      const file_id = function_type.code_file_id;

      // Check if the function exists with that id and version
      let functionPrev = null;
      try {
        functionPrev = await this.functionModel.findOne({
          id,
          version,
          function_type:type,
          owner
        }).exec();
        if (!functionPrev) {
          throw new Error("Function doesn't exist, please create a function first");
        }
      } catch{
        const msg = `A function with the id: ${id}, version: ${version}, type: ${type} and owner: ${owner} doesn't exist.`;
        this.logger.error("updateFunction: " + msg);
        throw new NotAcceptableException(msg);
      }

      // Check if the code file is new
      const newFileCode = file_id !== functionPrev.code_file_id;

      if (newFileCode) {
        // Check if the code file exists in the temp collection and get it
        let tempCodeFile = null;
        try {
          tempCodeFile = await this.functionTempCodeModel.findById(file_id);
          if (!tempCodeFile) throw new Error();
        } catch (err) {
          const msg = "There isn't a function code with the provided code_file_id";
          this.logger.error("updateFunction: " + msg);
          throw new NotAcceptableException(msg);
        }

        // Copy the temp code file from the temp collection to the stable collection
        try {
          await this.functionCodeModel.create({
            mimetype: tempCodeFile.mimetype,
            originalname: tempCodeFile.originalname,
            code: tempCodeFile.code,
            _id: tempCodeFile._id
          });

          await this.functionTempCodeModel.deleteOne(tempCodeFile._id);
        } catch (err) {
          this.logger.error('updateFunction: Server error', err);
          throw new InternalServerErrorException('Server error');
        }

        // Delete the old code file from the stable collection
        try {
          await this.functionCodeModel.deleteOne({ _id: new Types.ObjectId(functionPrev.code_file_id) });
        } catch (err) {
          this.logger.error('updateFunction: Server error on Delete.', err);
          throw new InternalServerErrorException('Server error');
        }
      }

      // Update the function class
      try {
        const {
          function_type,
          code_file_id,
          outputs,
          createdAt,
          updatedAt
        } = await this.functionModel.findOneAndUpdate(
            {
              id,
              version,
              function_type:type,
              owner
            },
            { $set: {
                code_file_id: file_id,
                outputs: functionData.outputs
              } },
            { new: true }
        );

        stored_types.push({code_file_id: code_file_id, type: function_type});
        responseBody.createdAt = createdAt;
        responseBody.updatedAt = updatedAt;
        responseBody.outputs = outputs;

      } catch (err) {
        this.logger.error('updateFunction: Server error on Update.', err);
        throw new InternalServerErrorException('Server error');
      }
    }

    responseBody.id = id;
    responseBody.function_types = stored_types;
    this.logger.debug('updateFunction: responseBody',responseBody);
    return responseBody;

  }

  async deleteFunction(id: string, owner: string, version?: string, type?: string): Promise<ResponseDeleteFunctionDto> {
    let totalDeletedCount = 0;

    // If version is defined, only that function version is deleted
    if (version && type) {
      // Get function data
      const functionData = await this.functionModel.findOne({ id, version, function_type:type}).exec();
      if (!functionData) {
        const msg = `A function with the id: ${id}, version: ${version}, type ${type} and owner: ${owner} doesn't exist.`;
        this.logger.error('deleteFunction: ' + msg);
        throw new NotFoundException();
      }

      try {

        // Delete function code
        await this.functionCodeModel.deleteOne({ _id: new Types.ObjectId(functionData.code_file_id) });

        // Delete function
        const { deletedCount } = await this.functionModel.deleteOne({ _id: new Types.ObjectId(functionData._id), owner});

        totalDeletedCount += deletedCount;
      } catch (err) {
        this.logger.error('deleteFunction: ', err);
        throw new InternalServerErrorException(err);
      }
    }

    //If version is defined but type is not, all the types of a function and version are deleted
    else if(version){
      const functionsData = await this.functionModel.find({ id, version, owner });
      if (functionsData.length === 0) {
        const msg = `There is no function with the id: ${id}, version ${version} and owner: ${owner}`;
        this.logger.error('deleteFunction: ' + msg);
        throw new NotFoundException(msg);
      }

      try {
        for (let i = 0; i < functionsData.length; i++) {
          const functionData = functionsData[i];

          // Delete function code
          await this.functionCodeModel.deleteOne({ _id: new Types.ObjectId(functionData.code_file_id) });

          // Delete function
          const { deletedCount } = await this.functionModel.deleteOne({ _id: new Types.ObjectId(functionData._id),owner });

          totalDeletedCount += deletedCount;

        }
      } catch (err) {
        this.logger.error('deleteFunction: ', err);
        throw new InternalServerErrorException(err);
      }
    }

    // If version is not defined, all the versions of that function are deleted
    else {
      const functionsData = await this.functionModel.find({ id, owner });
      if (functionsData.length === 0) {
        const msg = `There is no function with the id: ${id} and owner: ${owner}`;
        this.logger.error('deleteFunction: ' + msg);
        throw new NotFoundException(msg);
      }

      try {
        for (let i = 0; i < functionsData.length; i++) {
          const functionData = functionsData[i];

          // Delete function code
          await this.functionCodeModel.deleteOne({ _id: new Types.ObjectId(functionData.code_file_id) });

          // Delete function
          const { deletedCount } = await this.functionModel.deleteOne({ id: functionData.id, owner });

          totalDeletedCount += deletedCount;
          
        }
      } catch (err) {
        this.logger.error('deleteFunction: ', err);
        throw new InternalServerErrorException(err);
      }
    }

    this.logger.debug('deleteFunction: Deleted Count', totalDeletedCount);
    return {
      deletedCount: totalDeletedCount
    }
  }

  async getFunction(id: string, owner: string, version?: string, type?: string): Promise<ResponseFunctionDto> {
    let functionData = null;

    // If version and type are defined, we get that specific function
    if (version && type) {
      try {
        let resp = await this.functionModel.findOne({ id, version, function_type: type, owner }).lean().exec();
        if (!resp) {
          throw new Error(`A function with the id: ${id}, version: ${version} and owner: ${owner} doesn't exist.`);
        }

        functionData = {
          id: id,
          version: resp.version,
          outputs: resp.outputs,
          function_types:[{type: resp.function_type, code_file_id: resp.code_file_id}]
        };


      } catch (err) {
        this.logger.error('getFunction: ', err);
        throw new NotFoundException(err);
      }
    }

    // If version but not type is defined, we get that specific function
    else if (version) {
      try {
        const resp = await this.functionModel.find({ id, version, owner }).lean().exec();
        if (resp.length === 0) {
          throw new Error(`A function with the id: ${id}, version: ${version} and owner: ${owner} doesn't exist.`);
        }

        functionData = {
          id: id,
          version: resp[0].version,
          outputs: resp[0].outputs,
          function_types:[]
        };
        for (const f of resp) {
          functionData.function_types.push({type:f.function_type, code_file_id: f.code_file_id});
        }

      } catch (err) {
        this.logger.error('getFunction: ', err);
        throw new NotFoundException(err);
      }
    }

    // If not, we get the latest version
    else {
      try {
        const lastVersion = await this.functionModel.findOne({ id, owner }).sort({ version: -1 }).lean().exec();
        if (!lastVersion) {
          throw new Error(`A function with the id: ${id} and owner:${owner} doesn't exist.`);
        }

        const resp = await this.functionModel.find({ id:id, version: lastVersion.version , owner: owner }).lean().exec();
        if (!resp) {
          throw new Error(`A function with the id: ${id}, version: ${version} and owner: ${owner} doesn't exist.`);
        }

        functionData = {
          id: id,
          version: resp[0].version,
          outputs: resp[0].outputs,
          function_types:[]
        };
        for (const f of resp) {
          functionData.function_types.push({type:f.function_type, code_file_id: f.code_file_id});
        }

      } catch (err) {
        this.logger.error('getFunction: ', err);
        throw new NotFoundException(err);
      }
    }

    this.logger.debug('getFunction: ',functionData);
    const {_id, __v, ...responseBody} = functionData;
    return responseBody;
  }

  async getFunctionCode(id: string): Promise<any> {
    const doc = await this.functionCodeModel.findOne({ _id: id }).lean();
    if (!doc) {
      const msg = `Not found function code with id: ${id}`;
      this.logger.error('getFunctionCode: ' + msg);
      throw new NotFoundException(msg);
    }
    return doc;
  }

  async getFunctionVersions(id: string, owner: string): Promise<ResponseFunctionVersionsDto> {
    const functionsData = await this.functionModel.find({ id, owner });
    if (functionsData.length === 0) {
      const msg = `There is no function with the id: ${id} and owner: ${owner}`;
      this.logger.error('getFunctionVersions: ' + msg);
      throw new NotFoundException(msg);
    }
    let versions = [];
    functionsData.map(item => {
      if (!versions.includes(item.version))
        versions.push(item.version);
    });

    return { versions };
  }

  async findFunctions(offset: number, limit: number, id_partial?: string): Promise<ResponseFunctionListDto> {
    try {

      // Get the functions (only the latest version of each function)
      let searchParameters:PipelineStage[]=[
        { $sort: { version: -1 } },
        { $group: { _id: {"id":"$id", "function_type": "$function_type"}, lastObject: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$lastObject" } }
      ];

      let countParameters:PipelineStage[]=[
        { $group: { _id: "$id" } }
      ];

      if (typeof id_partial !== 'undefined'){
        //In case of partial id set, set match parameter using regex
        searchParameters.push({ $match: { "id": { "$regex": id_partial, "$options": "i" } }});
        countParameters.push({ $match: { "_id": { "$regex": id_partial, "$options": "i" } }});
      }

      searchParameters.push(
          { $skip: offset },
          { $limit: limit });

      countParameters.push({ $count: "total" });

      const result = await this.functionModel.aggregate(searchParameters).exec();

      //Get database result, group by id and concat types in array.
      const tmpItems = result.map(f => ({
        id: f.id,
        function_types: [{type:f.function_type, code_file_id: f.code_file_id}],
        version: f.version,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        outputs: f.outputs
      }));

      let groupItems: { [index: string]: any; } = {};
      tmpItems.forEach(item => {
        if(item.id in groupItems){
          groupItems[item.id].function_types = groupItems[item.id].function_types.concat(item.function_types);
        }else {
          groupItems[item.id] = item;
        }
      });

      const items = Object.keys(groupItems).map(key => groupItems[key]);

      // Count the total number of functions
      const totalCount = await this.functionModel.aggregate(countParameters);
      let total = totalCount.length > 0 ? totalCount[0].total : 0;

      return {
        items,
        total,
        limit,
        offset
      };
    } catch (err) {
      this.logger.error('findFunctions: ', err);
      throw new InternalServerErrorException(err);
    }
  }
  //TODO: Obtener workflow devolver class specification con typo
}