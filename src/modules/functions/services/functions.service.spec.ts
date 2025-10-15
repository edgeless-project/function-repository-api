import { Test, TestingModule } from '@nestjs/testing';
import { FunctionService } from '@modules/functions/services/functions.service';
import { Function as FunctionSchema, FunctionDocument } from '@modules/functions/schemas/function.schema';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { ConfigModule } from '@common/config/config.module';
import { ConfigService } from '@common/config/config.service';
import { Connection, Model, Types } from 'mongoose';
import { GridFSBucket, GridFSBucketWriteStream } from 'mongodb';
import {NotAcceptableException, NotFoundException, StreamableFile} from '@nestjs/common';
import {FunctionClassSpecificationDto} from "@modules/functions/model/dto/function/class-specification.dto";

const mockGridFSBucket = {
	openUploadStream: jest.fn(),
	find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
	delete: jest.fn(),
	openDownloadStream: jest.fn(),
};
jest.mock('mongodb', () => {
	const originalModule = jest.requireActual('mongodb');
	return {
		...originalModule,
		GridFSBucket: jest.fn().mockImplementation(() => mockGridFSBucket),
	};
});

describe('FunctionsService', () => {
	let service: FunctionService;
	let functionModel: jest.Mocked<Model<FunctionDocument>>;

	const mockConfigService = {
		get: jest.fn().mockImplementation((key: string) => {
			if (key === 'DOCUMENT_FUNCTION_BATCH_SIZE') {
				return '1048576';
			}
			return null;
		}),
	};
	const mockCollection = {
		findOneAndUpdate: jest.fn(()=> Promise.resolve({lastErrorObject: {n:1, updatedExisting:true} })),
		deleteOne: jest.fn(()=> Promise.resolve({deletedCount:1, acknowledged:true})),
		deleteMany: jest.fn(()=> Promise.resolve({deletedCount:1, acknowledged:true})),
	};
	const mockDb = {
		collection: jest.fn().mockReturnValue(mockCollection),
		db: {
			collection: jest.fn().mockReturnValue(mockCollection)
		},
	};
	const mockFunctionModel = {
		db: mockDb,
		find: jest.fn(),
		findOne: jest.fn(),
		findOneAndUpdate: jest.fn(),
		deleteOne: jest.fn(()=> Promise.resolve({deletedCount:1, acknowledged:true})),
		create: jest.fn(async (doc: any) => ({
			...doc,
			createdAt: new Date(),
			updatedAt: new Date(),
		})),
		aggregate: jest.fn().mockReturnValue({ exec: jest.fn() }),
		exists: jest.fn((() => Promise.resolve(null))),
	};
	const mockConnection = {
		db: {}, // GridFSBucket constructor expects a `db` property.
	};

	beforeEach(async () => {
		// Reset mocks before each test
		jest.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			imports: [ConfigModule],
			providers: [
				FunctionService,
				{
					provide: getModelToken(FunctionSchema.name),
					useValue: mockFunctionModel
				},
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
				{
					provide: getConnectionToken(),
					useValue: mockConnection,
				},
			],

		}).compile();

		service = module.get<FunctionService>(FunctionService);
		functionModel = module.get(getModelToken(FunctionSchema.name));
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
	describe('createFunction', () => {
		const owner = 'test-owner';
		const functionDto: FunctionClassSpecificationDto = {
			id: 'test-func',
			version: '1.0.0',
			outputs: ['output1'],
			function_types: [
				{ type: 'mapper', code_file_id: new Types.ObjectId().toHexString() },
				{ type: 'reducer', code_file_id: new Types.ObjectId().toHexString() },
			],
		};

		it('should create a function with multiple types', async () => {

			const result = await service.createFunction(functionDto, owner);

			expect(mockFunctionModel.exists).toHaveBeenCalledWith({ id: functionDto.id, version: functionDto.version, owner });
			expect(mockCollection.findOneAndUpdate).toHaveBeenCalledTimes(2);
			expect(mockFunctionModel.create).toHaveBeenCalledTimes(2);
			expect(result.id).toBe(functionDto.id);
			expect(result.version).toBe(functionDto.version);
			expect(result.function_types).toHaveLength(2);
		});
		it('should throw NotAcceptableException if function already exists', async () => {
			mockFunctionModel.exists.mockResolvedValue({ _id: new Types.ObjectId() });

			await expect(service.createFunction(functionDto, owner)).rejects.toThrow(
				new NotAcceptableException(`A function with the id: ${functionDto.id}, version: ${functionDto.version} and owner: ${owner} already exists.`)
			);
		});
		it('should throw NotAcceptableException if code_file_id is not found', async () => {
			mockCollection.findOneAndUpdate.mockResolvedValueOnce({
				lastErrorObject: { n: 0, updatedExisting: false },
			});
			mockFunctionModel.exists.mockResolvedValueOnce(null);

			await expect(service.createFunction(functionDto, owner)).rejects.toThrow(
				new NotAcceptableException(`There isn't a function code with the code_file_id ${functionDto.function_types[0].code_file_id}`)
			);
		});
	});
	describe('deleteFunction', () => {
		const owner = 'test-owner';
		const id = 'func-to-delete';
		const version = '1.0.0';
		const type = 'mapper';
		const mockFunctionDoc = {
			_id: new Types.ObjectId(),
			id,
			version,
			function_type: type,
			code_file_id: new Types.ObjectId().toHexString(),
		} as FunctionDocument;

		it('should delete a specific function type and version', async () => {
			mockFunctionModel.findOne.mockReturnValue({ exec: () => Promise.resolve(mockFunctionDoc) } as any);

			const result = await service.deleteFunction(id, owner, version, type);

			expect(mockFunctionModel.findOne).toHaveBeenCalledWith({ id, version, function_type: type });
			expect(mockCollection.deleteOne).toHaveBeenCalledWith({"_id":new Types.ObjectId(mockFunctionDoc.code_file_id)});
			expect(mockFunctionModel.deleteOne).toHaveBeenCalledWith({ _id: mockFunctionDoc._id, owner });
			expect(result.deletedCount).toBe(1);
		});

		it('should delete all types for a specific version', async () => {
			const mockDocs = [
				mockFunctionDoc,
				{ ...mockFunctionDoc, _id: new Types.ObjectId(), function_type: 'reducer', code_file_id: new Types.ObjectId().toHexString() }
			];
			mockFunctionModel.find.mockResolvedValue(mockDocs as any);

			const result = await service.deleteFunction(id, owner, version);

			expect(mockFunctionModel.find).toHaveBeenCalledWith({ id, version, owner });
			expect(mockCollection.deleteOne).toHaveBeenCalledTimes(2);
			expect(mockFunctionModel.deleteOne).toHaveBeenCalledTimes(2);
			expect(result.deletedCount).toBe(2);
		});

		it('should delete all versions of a function', async () => {
			const mockDocs = [
				mockFunctionDoc,
				{ ...mockFunctionDoc, _id: new Types.ObjectId(), version: '2.0.0', code_file_id: new Types.ObjectId().toHexString() }
			];
			mockFunctionModel.find.mockResolvedValue(mockDocs as any);

			const result = await service.deleteFunction(id, owner);

			expect(mockFunctionModel.find).toHaveBeenCalledWith({ id, owner });
			expect(mockCollection.deleteOne).toHaveBeenCalledTimes(2);
			expect(mockFunctionModel.deleteOne).toHaveBeenCalledTimes(2);
			expect(result.deletedCount).toBe(2);
		});

		it('should throw NotFoundException if no function is found to delete', async () => {
			mockFunctionModel.findOne.mockReturnValue({ exec: () => Promise.resolve(null) } as any);

			await expect(service.deleteFunction(id, owner, version, type)).rejects.toThrow(NotFoundException);
		});
	});
	describe('getFunction', () => {
		const owner = 'test-owner';
		const id = 'func-to-get';
		const version = '1.0.0';

		it('should get the latest version when no version is specified', async () => {
			const latestVersionDoc = { id, version: '2.0.0', owner };
			const allTypesForLatestVersion = [
				{ id, version: '2.0.0', owner, function_type: 'mapper', code_file_id: 'file1', outputs: [] },
				{ id, version: '2.0.0', owner, function_type: 'reducer', code_file_id: 'file2', outputs: [] },
			];

			mockFunctionModel.findOne.mockReturnValueOnce({ sort: () => ({ lean: () => ({ exec: () => Promise.resolve(latestVersionDoc) }) }) } as any);
			mockFunctionModel.find.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(allTypesForLatestVersion) }) } as any);

			const result = await service.getFunction(id, owner);

			expect(mockFunctionModel.findOne).toHaveBeenCalledWith({ id, owner });
			expect(mockFunctionModel.find).toHaveBeenCalledWith({ id, version: '2.0.0', owner });
			expect(result.version).toBe('2.0.0');
			expect(result.function_types).toHaveLength(2);
		});

		it('should get a specific version when provided', async () => {
			const allTypesForVersion = [
				{ id, version, owner, function_type: 'mapper', code_file_id: 'file1', outputs: [] },
				{ id, version, owner, function_type: 'reducer', code_file_id: 'file2', outputs: [] },
			];
			mockFunctionModel.find.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(allTypesForVersion) }) } as any);

			const result = await service.getFunction(id, owner, version);

			expect(mockFunctionModel.find).toHaveBeenCalledWith({ id, version, owner });
			expect(result.version).toBe(version);
			expect(result.function_types).toHaveLength(2);
		});

		it('should throw NotFoundException if latest version is not found', async () => {
			mockFunctionModel.findOne.mockReturnValueOnce({ sort: () => ({ lean: () => ({ exec: () => Promise.resolve(null) }) }) } as any);

			await expect(service.getFunction(id, owner)).rejects.toThrow(NotFoundException);
		});
	});
	describe('updateFunction', () => {
		const owner = 'test-owner';
		const id = 'func-to-update';
		const version = '1.0.0';
		const functionDto: FunctionClassSpecificationDto = {
			id,
			version,
			outputs: ['new_output'],
			function_types: [
				{ type: 'mapper', code_file_id: new Types.ObjectId().toHexString() },
			],
		};
		const existingFunction = {
			_id: new Types.ObjectId(),
			id,
			version,
			owner,
			function_type: 'mapper',
			code_file_id: new Types.ObjectId().toHexString(),
			outputs: ['old_output'],
		};

		it('should update an existing function', async () => {
			mockFunctionModel.find.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve([existingFunction]) }) });
			mockFunctionModel.findOneAndUpdate.mockResolvedValue({ ...existingFunction, ...functionDto.function_types[0], outputs: functionDto.outputs });

			const result = await service.updateFunction(id, version, functionDto, owner);

			expect(mockFunctionModel.find).toHaveBeenCalledWith({ id, version, owner });
			expect(mockCollection.findOneAndUpdate).toHaveBeenCalledTimes(1);
			expect(mockFunctionModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
			expect(result.outputs).toEqual(['new_output']);
		});

		it('should throw NotFoundException if the function to update is not found', async () => {
			mockFunctionModel.find.mockReturnValue({ lean: () => ({ exec: () => Promise.resolve(null) }) });

			await expect(service.updateFunction(id, version, functionDto, owner)).rejects.toThrow(
				new NotFoundException(`updateFunction: A function with the id: ${id}, version: ${version} and owner: ${owner} doesn't exist.`)
			);
		});

		it('should throw NotAcceptableException if a code_file_id is not found', async () => {
			mockFunctionModel.find.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve([existingFunction]) }) });
			mockCollection.findOneAndUpdate.mockResolvedValue({
				lastErrorObject: { n: 0, updatedExisting: false },
			});

			await expect(service.updateFunction(id, version, functionDto, owner)).rejects.toThrow(
				new NotAcceptableException(`There isn't a new function code with the code_file_id ${functionDto.function_types[0].code_file_id}`)
			);
		});
	});
	describe('saveFunctionCode', () => {
		it('should upload a file to GridFS and return its ID', async () => {
			const mockFile = {
				buffer: Buffer.from('function content'),
				originalname: 'test.js',
				mimetype: 'application/javascript',
			} as Express.Multer.File;

			const mockStreamId = new Types.ObjectId();
			const mockUploadStream = {
				id: mockStreamId,
				...new StreamableFile(mockFile.buffer).getStream(), // a readable stream
			} as unknown as GridFSBucketWriteStream;

			mockGridFSBucket.openUploadStream.mockReturnValue(mockUploadStream);

			const result = await service.saveFunctionCode(mockFile);

			expect(result).toEqual({
				id: expect.stringMatching(new RegExp(`^${mockStreamId.toString().slice(0, -2)}..$`)),
			});
		});
	});
});
