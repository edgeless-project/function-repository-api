import { Test, TestingModule } from '@nestjs/testing';
import { AdminFunctionController } from './admin-function.controller';
import { FunctionService } from '@modules/functions/services/functions.service';
import { FunctionClassSpecificationDto } from "@modules/functions/model/dto/function/class-specification.dto";
import { ResponseFunctionDto } from "@modules/functions/model/dto/function/response-function.dto";
import { UpdateFunctionDto } from "@modules/functions/model/dto/function/update-function.dto";
import {ResponseUploadFunctionCodeDto} from "@modules/functions/model/dto/function/response-upload-function-code.dto";
import { Response } from 'express';
import {ResponseFunctionVersionsDto} from "@modules/functions/model/dto/function/response-function-versions.dt";

describe('AdminFunctionController', () => {
	let controller: AdminFunctionController;

	const mockFileData = {
		mimetype: 'application/javascript',
		originalname: 'test.js',
		code: Buffer.from('console.log("Hi FunctionRepositoryAPI");'),
	};

	const mockVersions = { versions: ['1.0', '1.1', '2.0'] };

	const mockFunctionService = {
		createFunction: jest.fn((dto) => {
			return {
				id: dto.id,
				version: dto.version,
				function_types: dto.function_types,
				createdAt: Date.now(),
				updatedAt: Date.now(),
				outputs: dto.outputs
			}
		}),
		updateFunction: jest.fn((id: string, version: string, dto: UpdateFunctionDto, owner: string)=>{
			const mockVersion = version || '';
			const dateNow = new Date().toUTCString();
			return {
				id: id,
				version: mockVersion,
				function_types: dto.function_types,
				createdAt: dateNow,
				updatedAt: dateNow,
				outputs: dto.outputs
			}
		}),
		deleteFunction: jest.fn((dto) =>{
			return {
				deletedCount: [dto.id].length
			}
		}),
		getFunction: jest.fn((id, owner, version, type)=>{
			const finalVersion = version || mockVersions.versions[mockVersions.versions.length - 1];
			return {
				id: id,
				version: finalVersion,
				outputs: [],
				function_types: [{ type: type || 'typeA', code_file_id: 'file123' }],
			}
		}),
		saveFunctionCode: jest.fn((dto:File)=>{
			if (!dto) {
				throw new Error('File not provided');
			}
			return { id: 'generated-file-id' };
		}),
		getFunctionCode: jest.fn((dot)=>{
			return mockFileData;
		}),
		getFunctionVersions: jest.fn((id)=>{
			return mockVersions;
		}),
		findFunctions: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AdminFunctionController],
			providers: [
				{ provide: FunctionService, useValue: mockFunctionService },
			],
		}).compile();

		controller = module.get<AdminFunctionController>(AdminFunctionController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('createFunction', () => {
		it('should call service.createFunction and return its result', async () => {
			const mockDto: FunctionClassSpecificationDto = {
				id: '000000001',
				version: '0.1',
				outputs: ['output1', 'output2'],
				function_types: [
					{
						type: 'type1',
						code_file_id: 'code-file-id-1',
					}
				]
			};
			const expectedResult : ResponseFunctionDto = {
				id: mockDto.id,
				version: mockDto.version,
				function_types: mockDto.function_types,
				createdAt: expect.any(Number),
				updatedAt: expect.any(Number),
				outputs: mockDto.outputs
			}

			const result = await controller.createFunction(mockDto);

			expect(mockFunctionService.createFunction).toHaveBeenCalledWith(mockDto, 'admin');
			expect(result).toEqual(expectedResult);
		});
	});
	describe('updateFunction', () => {
		it('should call service.updateFunction and return its result updating function_types and outputs', async () => {
			const mockDto: UpdateFunctionDto = {
				function_types: [{ type: 'typeA', code_file_id: 'file123' }],
				outputs: ['success_cb', 'failure_cb']
			};
			const dateNow = new Date().toUTCString();
			const expectedResult = {
				id: 'fun1',
				version: '1.0',
				function_types: [{ type: 'typeA', code_file_id: 'file123' }],
				createdAt: dateNow,
				updatedAt: dateNow,
				outputs: ['success_cb', 'failure_cb']
			};

			// Call the controller method
			const result = await controller.updateFunction(mockDto, 'fun1', '1.0');
			// Verify that the service was called with correct args
			expect(mockFunctionService.updateFunction).toHaveBeenCalledWith('fun1', '1.0', mockDto, 'admin');
			// Verify the response
			expect(result).toEqual(expectedResult);
		});
	});
	describe('deleteFunction', () => {
		it('should call service.deleteFunction and return its result', async () => {
			const id = 'func123';
			const version = '1.0';
			const type = 'typeA';

			const expectedResult = {deletedCount: 1}
			const result = await controller.deleteFunction(id, version, type);

			expect(mockFunctionService.deleteFunction).toHaveBeenCalledWith(id, 'admin', version, type);
			expect(result).toEqual(expectedResult);
		});
	});
	describe('getFunction', () => {
		it('should call service.getFunction and return its result with specific version and type', async () => {
			const id = 'func123';
			const version = '1.0';
			const type = 'typeA';

			const expectedResult = {
					id: id,
					version: version,
					outputs: [],
					function_types: [{ type: 'typeA', code_file_id: 'file123' }],
				}

			const result = await controller.getFunction(id, version, type);

			expect(mockFunctionService.getFunction).toHaveBeenCalledWith(id, 'admin', version, type);
			expect(result).toEqual(expectedResult);
		});

		it('should call service.getFunction with only id to get latest version', async () => {
			const id = 'func123';

			const expectedResult = {
				id,
				version: mockVersions.versions[mockVersions.versions.length - 1],
				outputs: [],
				function_types: [{ type: 'typeA', code_file_id: 'file123' }],
			};

			const result = await controller.getFunction(id, null, null);

			expect(mockFunctionService.getFunction).toHaveBeenCalledWith(id, 'admin', null, null);
			expect(result).toEqual(expectedResult);
		});
	});
	describe('uploadFunctionCode', () => {
		it('should call service.saveFunctionCode with uploaded file and return response', async () => {

			const expectedResult : ResponseUploadFunctionCodeDto = { id: 'generated-file-id' };

			const result = await controller.uploadFunctionCode(mockFileData as any);

			expect(mockFunctionService.saveFunctionCode).toHaveBeenCalledWith(mockFileData);
			expect(result).toEqual(expectedResult);
		});

		it('should throw NotAcceptableException if file is not provided', async () => {
			await expect(controller.uploadFunctionCode(null)).rejects.toThrow();
		});
	});
	describe('getFunctionCode', () => {
		it('should retrieve file and send it with correct headers', async () => {
			const id = 'file123';

			// Create mock response object with jest mocks for setHeader and end
			const resMock = {
				setHeader: jest.fn(),
				end: jest.fn(),
			} as any as Response;

			// Call the controller method
			await controller.getFunctionCode(id, resMock);

			// Verify headers are set properly
			expect(resMock.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('attachment'));
			expect(resMock.setHeader).toHaveBeenCalledWith('Content-Type', mockFileData.mimetype);

			// Verify response end is called with the buffer
			expect(resMock.end).toHaveBeenCalled();
		});
	});
	describe('getFunctionVersions', () => {
		it('should call service.getFunctionVersions and return the versions array', async () => {
			const id = 'func1';

			const result: ResponseFunctionVersionsDto = await controller.getFunctionVersions(id);

			expect(mockFunctionService.getFunctionVersions).toHaveBeenCalledWith(id, 'admin');
			expect(result).toEqual(mockVersions);
		});
	});
	describe('findFunctions', () => {
		const offset = 0;
		const limit = 10;
		const partial = 'searchTerm';

		const mockResult = {
			items: [
				{
					id: 'func1_searchTerm',
					function_types: [{ type: 'typeA', code_file_id: 'file1' }],
					version: '1.0',
					createdAt: new Date(),
					updatedAt: new Date(),
					outputs: [],
				},
			],
			total: 1,
			limit,
			offset,
		};

		it('should call service.findFunctions with correct params and return result', async () => {

			mockFunctionService.findFunctions.mockResolvedValue(mockResult);

			const result = await controller.findFunctions(offset, limit, partial);

			expect(mockFunctionService.findFunctions).toHaveBeenCalledWith(offset, limit, partial);
			expect(result).toEqual(mockResult);
		});

		it('should call service.findFunctions with default params when partial_search is null', async () => {
			mockFunctionService.findFunctions.mockResolvedValue(mockResult);

			const result = await controller.findFunctions(offset, limit, null);

			expect(mockFunctionService.findFunctions).toHaveBeenCalledWith(offset, limit);
			expect(result).toEqual(mockResult);
		});
	});

});