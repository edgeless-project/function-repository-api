import { Test, TestingModule } from '@nestjs/testing';
import {Model, mongo} from "mongoose";
import {getModelToken} from "@nestjs/mongoose";
import {ObjectId} from "mongodb";
import {ApikeyService} from "@common/auth/services/apikey.service";
import {ApiKey, ApiKeyDocument} from "@common/auth/schemas/apikey.schema";
import {UsersService} from "@modules/users/services/users.service";
import {UserRole} from "@modules/users/model/contract/user.interface";

describe("ApiKeyService", () => {
	let service: ApikeyService;
	let apiKeyModel: jest.Mocked<Model<ApiKeyDocument>>;

	const sampleApiKeys: ApiKey[] = [
		{_id: new mongo.ObjectId(1), key: 'secretkey1', name: 'Key1', owner: 'admin', createdAt: new Date()},
		{_id: new mongo.ObjectId(2), key: 'secretkey2', name: 'Key2', owner: 'noAdmin', createdAt: new Date()},
		{_id: new mongo.ObjectId(3), key: 'secretkey3', name: 'Key3', owner: 'admin', createdAt: new Date()}
	];

	const sampleUsers = [
		{id: 'admin', email: 'admin', role: UserRole.ClusterAdmin},
		{id: 'noAdmin', email: 'noadmin', role: UserRole.FunctionDeveloper},
	];


	const mockUsersService = {
		getById: jest.fn((id) => {
			const user = sampleUsers.find((usr)=> usr.id === id);
			if (user) {
				return Promise.resolve(user);
			}

			return Promise.reject(new Error('User not found'));
		}),
	};
	const mockApiKeyModel = {
		create: jest.fn((dto) => ({
			...dto,
			id: new mongo.ObjectId().toString(),
		})),
		deleteOne: jest.fn((query) => ({
			exec: jest.fn(() => {
				const index = sampleApiKeys.findIndex((key) => key._id.toString() === query._id.toString());
				if (index !== -1) {
					sampleApiKeys.splice(index, 1);
					return { deletedCount: 1 };
				}
				return { deletedCount: 0 };
			})
		})),
		deleteMany: jest.fn((query) => {
			const initialLength = sampleApiKeys.length;
			const filteredKeys = sampleApiKeys.filter((key) => key.owner !== query.owner);
			const deletedCount = initialLength - filteredKeys.length;
			sampleApiKeys.length = 0;
			sampleApiKeys.push(...filteredKeys);
			return { deletedCount };
		}),
		find: jest.fn((query) => ({
			limit: jest.fn((limit) => ({
				skip: jest.fn((offset) => ({
					exec: jest.fn(() => {
						return Promise.resolve(sampleApiKeys.slice(offset, offset + limit))
					}),
				})),
			})),
		})),
		findOne: jest.fn((query) => ({
			exec: jest.fn(()=>{
				const or_key = query['$or']? query['$or'][1].key : query.key;
				const owner = query['owner'];
				return Promise.resolve(sampleApiKeys.find((key) => key.key === or_key && (!owner || key.owner === owner)));
			})
		})),
		countDocuments: jest.fn((query) => ({
			exec: jest.fn(()=> {
				return Promise.resolve(sampleApiKeys.filter((key) => (query.owner ? key.owner === query.owner : true)).length);
			})
		})),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ApikeyService,
				{
					provide: getModelToken(ApiKey.name),
					useValue: mockApiKeyModel
				},
				{
					provide: UsersService,
					useValue: mockUsersService
				}
			],
		}).compile();
		service = module.get<ApikeyService>(ApikeyService);
		apiKeyModel = module.get(getModelToken(ApiKey.name));
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('createApiKey', () => {
		it('creates an API key with valid inputs', async () => {
			const owner = 'user1';
			const name = 'TestKey';
			const length = 32;
			const expectedResponse = {
				id: expect.any(String),
				key: expect.any(String),
				name: name,
				owner: owner,
				createdAt: expect.any(Date)
			}

			const result = await service.createKey(length, owner, name);

			expect(mockApiKeyModel.create).toHaveBeenCalledWith({ key: expect.any(String), name, owner, createdAt: expect.any(Date) });
			expect(result).toEqual(expectedResponse);
		});
	});
	describe('getApiKey', () => {
		it('gets an API key by key', async () => {
			const expectedResponse = {
				id: sampleApiKeys[0]._id.toString(),
				key: sampleApiKeys[0].key,
				name: sampleApiKeys[0].name,
				owner: sampleApiKeys[0].owner,
				createdAt: sampleApiKeys[0].createdAt,
				role: UserRole.ClusterAdmin
			};
			const result = await service.getApiKey(expectedResponse.key);
			expect(result).toEqual(expectedResponse);
		})
	});
	describe('validateApiKey', () => {
		it('validates an API key by key', async () => {
			const key = sampleApiKeys[0].key;
			const result = await service.validateApiKey(key);
			expect(result).toEqual(true);
		});
		it('does not validate an API key', async () => {
			const key = sampleApiKeys[0].key + '1';
			const result = await service.validateApiKey(key);
			expect(result).toEqual(false);
		})
	});
	describe('getApiKeys', () => {
		it('gets all API keys', async () => {
			const limit = 10;
			const offset = 0;
			const expectedResponse = sampleApiKeys.map((key) => ({
				id: key._id.toString(),
				key: key.key.slice(0, 5)+"**************",
				name: key.name,
				owner: expect.any(String),
				createdAt: key.createdAt,
				role: expect.any(String)
			}));

			const result = await service.getApiKeys(offset, limit);
			expect(result).toEqual({
				items: expectedResponse,
				limit: limit,
				offset: offset,
				total: sampleApiKeys.slice(offset, offset + limit).length
			});


		})
	});
	describe('getUserByApiKey', () => {
		it('gets the user associated with an API key', async () => {
			const key = sampleApiKeys[0].key;
			const expectedResponse = {
				id: sampleApiKeys[0].owner,
				email: sampleUsers[0].email,
				role: sampleUsers[0].role
			};
			const result = await service.getUserByApiKey(key);
			expect(result).toEqual(expectedResponse);
		})
	});
	describe('deleteApiKey', () => {
		it('deletes an API key by key', async () => {
			const key = sampleApiKeys[0]._id.toString();
			const expectedResponse = { elementsDeleted: 1 };
			const result = await service.deleteKey(key);
			expect(mockApiKeyModel.deleteOne).toHaveBeenCalledWith({ _id: key });
			expect(result).toEqual(expectedResponse);
		})

		it('deletes 0 API keys when ID not found', async () => {
			const key = 'NoId';
			const expectedResponse = { elementsDeleted: 0 };
			const result = await service.deleteKey(key);
			expect(mockApiKeyModel.deleteOne).toHaveBeenCalledWith({ _id: key });
			expect(result).toEqual(expectedResponse);
		})
	})

});