import { HttpException, Injectable, InternalServerErrorException, Logger, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ConfigService } from '../../../common/config/config.service';
import { FunctionClassSpecificationDto } from '../model/dto/function/class-specification.dto';
import { Function, FunctionDocument } from '../schemas/function.schema';
import { FunctionCode, FunctionCodeDocument } from '../schemas/function-code.schema';
import { FunctionTempCode, FunctionTempCodeDocument } from '../schemas/function-temp-code.schema';
import { ResponseFunctionDto } from '../model/dto/function/response-function.dto';
import { ResponseUploadFunctionCodeDto } from '../model/dto/function/response-upload-function-code.dto';
import { ResponseDeleteFunctionDto } from '../model/dto/function/response-delete-function.dto';
import { UpdateFunctionDto } from '../model/dto/function/update-function.dto';
import { ResponseFunctionVersionsDto } from '../model/dto/function/response-function-versions.dt';


@Injectable()
export class FunctionService {
  private logger = new Logger('FunctionService', { timestamp: true});

  constructor(
    @InjectModel(Function.name) private readonly functionModel: Model<FunctionDocument>,
    @InjectModel(FunctionCode.name) private readonly functionCodeModel: Model<FunctionCodeDocument>,
    @InjectModel(FunctionTempCode.name) private readonly functionTempCodeModel: Model<FunctionTempCodeDocument>,
  ) {}

  async createFunction(functionData: FunctionClassSpecificationDto, owner: string): Promise<ResponseFunctionDto> {

    if (!functionData.code_file_id) {
      this.logger.error('createFunction: code_file_id not provided');
      throw new NotAcceptableException('code_file_id not provided');
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

    // Check if the code file exists in the temp collection and get it
    let tempCodeFile = null;
    try {
      tempCodeFile = await this.functionTempCodeModel.findById(functionData.code_file_id);
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
        _id
      } = await this.functionModel.create({owner, ...functionData});

      const responseBody = {
        id,
        function_type,
        version,
        code_file_id,
        outputs,
      }
      this.logger.debug('createFunction: responseBody',responseBody);
      return responseBody;
  
    } catch (err) {
      this.logger.error('createFunction: Server error', err);
      throw new InternalServerErrorException('Server error');
    }
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

    if (!functionData.code_file_id) {
      const msg = 'code_file_id not provided';
      this.logger.error('updateFunction: ' + msg);
      throw new NotAcceptableException(msg);
    }

    // Check if the function exists with that id and version
    let functionPrev = null;
    try {
      functionPrev = await this.functionModel.findOne({
        id, 
        version,
        owner
      }).exec();
      if (!functionPrev) {
        throw new Error("Function doesn't exist, please create a function first");
      }
    } catch {
      const msg = `updateFunction: A function with the id: ${id}, version: ${version} and owner: ${owner} doesn't exist.`;
      this.logger.error("updateFunction: " + msg);
      throw new NotAcceptableException(msg);
    }

    // Check if the code file is new
    const newFileCode = functionData.code_file_id === functionPrev.code_file_id ? false : true;

    if (newFileCode) {
      // Check if the code file exists in the temp collection and get it
      let tempCodeFile = null;
      try {
        tempCodeFile = await this.functionTempCodeModel.findById(functionData.code_file_id);
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
        this.logger.error('updateFunction: Server error', err);
        throw new InternalServerErrorException('Server error');
      }

    }

    // Update the function class
    try {
      const {
        function_type,
        code_file_id,
        outputs
      } = await this.functionModel.findOneAndUpdate(
        {
          id, 
          version,
          owner
        },
        { $set: {
          function_type: functionData.function_type,
          code_file_id: functionData.code_file_id,
          outputs: functionData.outputs
        } },
        { new: true }
      );

      const responseBody = {
        id,
        function_type,
        version,
        code_file_id,
        outputs,
      }
      this.logger.debug('updateFunction: responseBody',responseBody);
      return responseBody;
  
    } catch (err) {
      this.logger.error('updateFunction: Server error', err);
      throw new InternalServerErrorException('Server error');
    }
  }

  async deleteFunction(id: string, owner: string, version?: string): Promise<ResponseDeleteFunctionDto> {
    let totalDeletedCount = 0;

    // If version is defined, only that function version is deleted
    if (version) {
      // Get function data
      const functionData = await this.functionModel.findOne({ id, version }).exec();
      if (!functionData) {
        const msg = `A function with the id: ${id}, version: ${version} and owner: ${owner} doesn't exist.`;
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

    this.logger.debug('deleteFunction: deletedCount', totalDeletedCount);
    return {
      deletedCount: totalDeletedCount
    }
  }

  async getFunction(id: string, owner: string, version?: string): Promise<FunctionClassSpecificationDto> {
    let functionData = null;
    // If version is defined, we get that version
    if (version) {
      try {
        functionData = await this.functionModel.findOne({ id, version, owner }).lean().exec();
        if (!functionData) {
          throw new Error(`A function with the id: ${id}, version: ${version} and owner: ${owner} doesn't exist.`);
        }
      } catch (err) {
        this.logger.error('getFunction: ', err);
        throw new NotFoundException(err);
      }
    }

    // If not, we get the latest version
    else {
      try {
        functionData = await this.functionModel.findOne({ id, owner }).sort({ version: -1 }).lean().exec();
        if (!functionData) {
          throw new Error(`A function with the id: ${id} and owner:${owner} doesn't exist.`);
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
    const versions = functionsData.map(item => item.version);
    return { versions };
  }

  async findFunctions(offset: number, limit: number) {
    try {

      // Count the total number of functions
      const totalCount = await this.functionModel.aggregate([
        {
          $group: {
            _id: "$id"
          }
        },
        {
          $count: "total"
        }
      ]);

      const total = totalCount.length > 0 ? totalCount[0].total : 0;

      // Get the functions (only the latest version of each function)
      const result = await this.functionModel.aggregate([
        { $sort: { version: -1 } },
        { $group: { _id: "$id", lastObject: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$lastObject" } },
        { $skip: offset },
        { $limit: limit }
      ]).exec();

      const items = result.map(w => ({
        id: w.id,
        function_type: w.function_type,
        version: w.version
      }));

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
}