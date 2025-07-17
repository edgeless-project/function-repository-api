import {
	HttpException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotAcceptableException,
	NotFoundException,
	StreamableFile
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, mongo, PipelineStage, Types} from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';

import { FunctionClassSpecificationDto } from '../model/dto/function/class-specification.dto';
import { Function, FunctionDocument } from '../schemas/function.schema';
import { FunctionCode } from '../schemas/function-code.schema';
import { ResponseFunctionDto } from '../model/dto/function/response-function.dto';
import { ResponseUploadFunctionCodeDto } from '../model/dto/function/response-upload-function-code.dto';
import { ResponseDeleteFunctionDto } from '../model/dto/function/response-delete-function.dto';
import { UpdateFunctionDto } from '../model/dto/function/update-function.dto';
import { ResponseFunctionVersionsDto } from '../model/dto/function/response-function-versions.dt';
import { ResponseFunctionListDto } from '../model/dto/function/response-function-list.dto';
import { FunctionType } from "@modules/functions/model/contract/function/class-specification.interface";
import {ConfigService} from "@common/config/config.service";
import moment from "moment";


@Injectable()
export class FunctionService {
	private logger = new Logger('FunctionService', { timestamp: true});
	private documentBatchSize = 1048576; //Default Size in Bytes
	//GridFS Connexions
	private functionCodesMeta = this.functionModel.db.collection('functioncodes.files');
	private bucket = new mongo.GridFSBucket(this.functionModel.db.db,{bucketName:"functioncodes"});

	constructor(
		@InjectModel(Function.name) private readonly functionModel: Model<FunctionDocument>,
		private readonly config: ConfigService
	) {
		this.documentBatchSize = +config.get("DOCUMENT_FUNCTION_BATCH_SIZE");
	}

	//Cron function executed every 2 hours to delete obsolete code files
	@Cron(CronExpression.EVERY_2_HOURS)
	async handleCronDeleteExpiredFiles() {

		const docsToDelete = await this.bucket.find(
			{ "metadata.temp": true,
				uploadDate: {$lt: moment().subtract(1,'days').toDate()} //Get date from one day past
			}).toArray();
		docsToDelete.forEach(doc => {
			this.bucket.delete(doc._id);
			this.logger.debug('Deleted document ' + doc._id);
		});
		this.logger.debug('Cron Job executed every 2 hours. Docs deleted '+ docsToDelete.length);

	}

	async createFunction(functionData: FunctionClassSpecificationDto, owner: string): Promise<ResponseFunctionDto> {

		if (!functionData.function_types) {
			this.logger.error('createFunction: code_file_id and type not provided');
			throw new NotAcceptableException('Function types not provided');
		}

		let function_types:FunctionType[] = [];
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
			}else if (!t.type) {
				this.logger.error('createFunction: type not provided');
				throw new NotAcceptableException('type not provided');
			}

			// Check if the code file exists in the temp collection and get it
			try {
				await this.functionCodesMeta.findOneAndUpdate({_id: Types.ObjectId.createFromHexString(t.code_file_id)},
					{$set: {"metadata.temp": false}}
				).then((resp)=>{if(resp.lastErrorObject.n==0 || !resp.lastErrorObject.updatedExisting)
					throw new Error("No function found")});

			} catch (err) {
				const msg = `There isn't a function code with the code_file_id ${t.code_file_id}`;
				this.logger.error("createFunction: " + msg);
				throw new NotAcceptableException(msg);
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
				this.logger.error('createFunction: Server error on create:', err);
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


		const responseBody = {
			id: "null"
		};

		if (!file) {
			this.logger.error('saveFunctionCode: File not provided');
			throw new NotAcceptableException('File not provided');
		}

		// : Type validation

		try{
			const stream = new StreamableFile(file.buffer).getStream();
			const res = stream.pipe(this.bucket.openUploadStream(file.originalname.toString(),{
				chunkSizeBytes: this.documentBatchSize,
				metadata: { temp: true, mimetype: file.mimetype}
			}));

			responseBody.id = res.id.toString();
		}catch (e) {
			this.logger.error('saveFunctionCode: ', e);
			throw new NotAcceptableException(e);
		}
		this.logger.debug('saveFunctionCode: ', responseBody.id);
		return responseBody;
	}

	async updateFunction(id: string, version: string, functionData: UpdateFunctionDto, owner: string): Promise<ResponseFunctionDto> {

		let update_types:FunctionType[] = [];
		let responseBody = {
			id,
			version,
			function_types: functionData.function_types,
			createdAt: null,
			updatedAt: null,
			outputs: functionData.outputs
		}

		//Output check
		if (!functionData.outputs) {
			const msg = 'Output not provided';
			this.logger.error('updateFunction: ' + msg);
			throw new NotAcceptableException(msg);
		}

		//Get existing types for function
		let resp = await this.functionModel.find({ id, version, owner }).lean().exec();
		if (!resp) {
			throw new Error(`updateFunction: A function with the id: ${id}, version: ${version} and owner: ${owner} doesn't exist.`);
		}

		for (const f of resp) {
			const funToUpdate = functionData.function_types.find(value => value.type === f.function_type);

			if(funToUpdate && funToUpdate.code_file_id === f.code_file_id){
				update_types.push({type:f.function_type, code_file_id: f.code_file_id});
			}else if (funToUpdate) {

				if (!funToUpdate.code_file_id) {
					const msg = 'code_file_id not provided';
					this.logger.error('updateFunction: ' + msg);
					throw new NotAcceptableException(msg);
				}
				if (!funToUpdate.type) {
					const msg = 'type not provided';
					this.logger.error('updateFunction: ' + msg);
					throw new NotAcceptableException(msg);
				}

				// Check if the code file exists with the temp parameter and update it
				try {
					await this.functionCodesMeta.findOneAndUpdate({
							_id: Types.ObjectId.createFromHexString(funToUpdate.code_file_id),
							"metadata.temp": true
						},
						{$set: {"metadata.temp": false}}
					).then((resp) => {
						if (resp.lastErrorObject.n == 0 || !resp.lastErrorObject.updatedExisting) {
							throw new Error("No function code found");
						}
					});

				} catch (err) {
					const msg = `There isn't a new function code with the code_file_id ${funToUpdate.code_file_id}`;
					this.logger.error("updateFunction: On Update Function." + msg, err);
					throw new NotAcceptableException(msg);
				}

				// Delete old document from bucket
				try {
					await this.bucket.delete(Types.ObjectId.createFromHexString(f.code_file_id));//Throws exception if no document found
				} catch (err) {
					this.logger.error('updateFunction: Server error on Delete.', err);
					throw new InternalServerErrorException('Server error');
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
							function_type: f.function_type,
							owner
						},
						{
							$set: {
								code_file_id: funToUpdate.code_file_id,
								outputs: functionData.outputs
							}
						},
						{new: true}
					);

					update_types.push({code_file_id: code_file_id, type: function_type});
					responseBody.createdAt = createdAt;
					responseBody.updatedAt = updatedAt;
					responseBody.outputs = outputs;

				} catch (err) {
					this.logger.error('updateFunction: Server error on Update.', err);
					throw new InternalServerErrorException('Server error');
				}

			}else {
				// Delete expired function types that are on db but not on update request
				await this.deleteFunction(id, owner, version, f.function_type);
			}
		}

		//  Create new function types
		for (const t of functionData.function_types) {
			if (update_types.find(v=> v.type === t.type) == undefined) {

				// Check if the code file exists with the temp parameter and update it
				try {
					await this.functionCodesMeta.findOneAndUpdate({
							_id: Types.ObjectId.createFromHexString(t.code_file_id),
							"metadata.temp": true
						},
						{$set: {"metadata.temp": false}}
					).then((resp) => {
						if (resp.lastErrorObject.n == 0 || !resp.lastErrorObject.updatedExisting) {
							throw new Error("No function code found");
						}
					});

				} catch (err) {
					const msg = `There isn't a new function code with the code_file_id ${t.code_file_id}`;
					this.logger.error("updateFunction: On Create Function." + msg, err);
					throw new NotAcceptableException(msg);
				}

				// Create the function class
				try {
					const {
						function_type,
						code_file_id,
						outputs,
						createdAt,
						updatedAt
					} = await this.functionModel.create({
						owner:owner,
						id: id,
						version: version,
						code_file_id: t.code_file_id,
						function_type: t.type,
						outputs: functionData.outputs,
					});

					update_types.push({code_file_id: code_file_id, type: function_type});
					responseBody.createdAt = createdAt;
					responseBody.updatedAt = updatedAt;
					responseBody.outputs = outputs;

				} catch (err) {
					this.logger.error('updateFunction: Server error on create function', err);
					throw new InternalServerErrorException('Server error');
				}
			}
		}

		responseBody.id = id;
		responseBody.function_types = update_types;
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
				await this.bucket.delete(new Types.ObjectId(functionData.code_file_id));

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
					await this.bucket.delete(new Types.ObjectId(functionData.code_file_id));

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
					await this.bucket.delete(new Types.ObjectId(functionData.code_file_id));

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

		const msg = `Not found function code with id: ${id}`;
		let functionCode = new FunctionCode();
		let bufferArray = [];
		let bufferDoc: mongo.GridFSFile;

		try {
			const docs = await this.bucket.find({_id: Types.ObjectId.createFromHexString(id)}).toArray();
			const docStream = this.bucket.openDownloadStream(Types.ObjectId.createFromHexString(id));

			docs.forEach((doc) => {
				bufferDoc = doc;
			});

			await docStream.forEach((doc) => {
				bufferArray.push(doc);
			});

		}catch (e){
			this.logger.error('getFunctionCode: ' + e);
			throw new NotFoundException(msg);
		}

		functionCode.mimetype = bufferDoc.metadata.mimetype;
		functionCode.originalname = bufferDoc.filename;
		functionCode.code = Buffer.concat(bufferArray);

		return functionCode;
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
				{ $group: { _id: { "id":"$id", "function_type": "$function_type"}, lastObject: { $first: "$$ROOT" } } },
				{ $sort: { id: -1, version: -1, _id: -1 } },
				{ $replaceRoot: { newRoot: "$lastObject" } }
			];

			let countParameters:PipelineStage[]=[
				{ $group: { _id: "$id" } },
				{ $sort: { id: 1, _id: 1 }}
			];

			if (typeof id_partial !== 'undefined'){
				//In case of partial id set, set match parameter using regex
				searchParameters.push({ $match: { "id": { "$regex": id_partial, "$options": "i" } }});
				countParameters.push({ $match: { "_id": { "$regex": id_partial, "$options": "i" } }});
			} else {
				//Get distinct ids following limit and adds as filter
				const withinLim = countParameters.concat(
					{ $skip: offset },
					{ $limit: limit });

				const result_withinLim = await this.functionModel.aggregate(withinLim).exec();
				const parametersFinal = result_withinLim.map(f => (f._id));
				searchParameters.push({ $match: { "id": { "$in": parametersFinal} } })
			}

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
			countParameters.push({ $count: "total" });
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
}