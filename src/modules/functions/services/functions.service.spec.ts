import { Test, TestingModule } from '@nestjs/testing';
import {FunctionService} from "@modules/functions/services/functions.service";
import {Function, FunctionDocument} from "@modules/functions/schemas/function.schema";
import { getModelToken } from '@nestjs/mongoose';
import {ConfigModule} from "@common/config/config.module";
import {ConfigService} from "@common/config/config.service";
import {Model} from "mongoose";

jest.mock('mongodb', () => {
	const originalModule = jest.requireActual('mongodb');
	return {
		...originalModule,
		GridFSBucket: jest.fn().mockImplementation(() => {
			return {
				find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
				delete: jest.fn(), // etc.
			};
		}),
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

	const mockDb = {
		collection: jest.fn().mockReturnValue({
			drop: jest.fn().mockResolvedValue(true),
			findOneAndUpdate: jest.fn(),
			find: jest.fn(),
			create: jest.fn(),
			deleteOne: jest.fn(),
			}),
		db: jest.fn().mockReturnValue({}),
	};

	const mockFunctionModel = {
		db: mockDb,
		find: jest.fn(),
		findOne: jest.fn(),
		findOneAndUpdate: jest.fn(),
		deleteOne: jest.fn(),
		create: jest.fn(),
	} as any as jest.Mocked<Model<FunctionDocument>>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ConfigModule],
			providers: [
				FunctionService,
				{
					provide: getModelToken(Function.name),
					useValue: mockFunctionModel
				},
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
			],

		}).compile();

		service = module.get<FunctionService>(FunctionService);
		functionModel = module.get(getModelToken(Function.name));
	});

	// TODO: CHeck for correct implementation of the service methods. Problems with mongodb GridFSBucket

	/*it('should be defined', () => {
		expect(service).toBeDefined();
	});*/
})