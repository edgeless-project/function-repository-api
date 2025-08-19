import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuthController } from './admin-auth.controller';
import { AuthService } from '@common/auth/services/auth.service';
import {ApiKey} from "@common/auth/schemas/apikey.schema";
import {ApikeyService} from "@common/auth/services/apikey.service";
import { mongo } from 'mongoose';
import {UserRole} from "@modules/users/model/contract/user.interface";

describe('AdminAuthController', () => {
	let controller: AdminAuthController;
	const sampleApiKeys: ApiKey[] = [
		{_id: new mongo.ObjectId(1), key: 'secretkey1', name: 'Key1', owner: 'admin', createdAt: new Date()},
		{_id: new mongo.ObjectId(2), key: 'secretkey2', name: 'Key2', owner: 'noAdmin', createdAt: new Date()},
		{_id: new mongo.ObjectId(3), key: 'secretkey3', name: 'Key3', owner: 'admin', createdAt: new Date()}
	]
	const mockAuthService = {}
	const mockApiKeysService = {
		getApiKeys: jest.fn((offset: number, limit: number, owner?: string) => {
			if (owner) return sampleApiKeys.filter(key => key.owner === owner).slice(offset, offset + limit);
			else return sampleApiKeys.slice(offset, offset + limit);
		}),
		createKey: jest.fn((length: number, owner: string, name: string) => {
			const key = {
				_id: new mongo.ObjectId(sampleApiKeys.length + 1),
				key: 'secretkeyTest',
				name: name,
				owner: owner,
				createdAt: new Date()
			}
			sampleApiKeys.push(key);
			return key
		}),
		getApiKey: jest.fn((name: string, owner?: string) => {
			if (owner) return sampleApiKeys.find(key => key.name === name && key.owner === owner);
			else return sampleApiKeys.find(key => key.name === name);
		}),
		deleteKey: jest.fn((name: string, owner?: string) => {
			if (owner) return {elementsDeleted: sampleApiKeys.filter(key => key.name === name && key.owner === owner).length}
			return {elementsDeleted: sampleApiKeys.filter(key => key.name === name).length}
		}),
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AdminAuthController],
			providers: [
				{
					provide: AuthService,
					useValue: mockAuthService
				},
				{
					provide: ApikeyService,
					useValue: mockApiKeysService
				}
			]
		}).compile()
		controller = module.get<AdminAuthController>(AdminAuthController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	})

	describe('getApiKeys', () => {
		it('should get existing API keys for ClusterAdmin role', async () => {
			const offset = 0;
			const limit = 10;

			const result = await controller.GetApiKeys(
				{user: {role: UserRole.ClusterAdmin}} as any,
				offset,
				limit
			);

			expect(mockApiKeysService.getApiKeys).toHaveBeenCalledWith(offset, limit);
			expect(result).toEqual(sampleApiKeys);
		});
		it('should get API keys for a specific owner', async () => {
			const offset = 0;
			const limit = 10;
			const ownerId = 'admin';

			const expectedResult = sampleApiKeys.filter(key => key.owner === ownerId)
			const result = await controller.GetApiKeys(
				{user: {id: ownerId}} as any,
				offset,
				limit
			);

			expect(mockApiKeysService.getApiKeys).toHaveBeenCalledWith(offset, limit, ownerId);
			expect(result).toEqual(expectedResult);
		});
		it('should get the last API key with an offset of 2 if no user ID is provided', async () => {
			const offset = 2;
			const limit = 10;
			const expectedResult = sampleApiKeys.slice(2);

			const result = await controller.GetApiKeys({user: {role: UserRole.ClusterAdmin}} as any, offset, limit);

			expect(mockApiKeysService.getApiKeys).toHaveBeenCalledWith(offset, 10);
			expect(result).toEqual(expectedResult);
		});
	})
	describe('CreateApiKey', () => {
		it('should create an API key for a valid owner', async () => {
			const ownerId = 'noAdmin';
			const name = 'TestKey';

			const expectedResult = {
				_id: expect.any(mongo.ObjectId),
				key: expect.any(String),
				name: name,
				owner: ownerId,
				createdAt: expect.any(Date)
			}
			const result = await controller.CreateApiKey(
				{user: {id: ownerId}} as any,
				name
			);

			expect(mockApiKeysService.createKey).toHaveBeenCalledWith(32, ownerId, name);
			expect(result).toEqual(expectedResult);
		});
		it('should throw an error if owner ID is missing', async () => {
			await expect(
				controller.CreateApiKey({user: {}} as any, 'TestKey')
			).rejects.toThrow('Invalid credentials');
		});
	});
	describe('getApiKey', () => {
		it('should get an API key for ClusterAdmin role', async () => {
			const id = 'Key1';

			const expectedResult = sampleApiKeys.find(key => key.name === id);
			const result = await controller.getApiKey(
				{user: {id: 'user', role: UserRole.ClusterAdmin}} as any,
				id
			);

			expect(mockApiKeysService.getApiKey).toHaveBeenCalledWith(id);
			expect(result).toEqual(expectedResult);
		});
		it('should get an API key for a specific owner', async () => {
			const id = 'Key1';
			const ownerId = 'admin';

			const expectedResult = sampleApiKeys.find(key => key.name === id && key.owner === ownerId);
			const result = await controller.getApiKey(
				{user: {id: ownerId}} as any,
				id
			);

			expect(mockApiKeysService.getApiKey).toHaveBeenCalledWith(id, ownerId);
			expect(result).toEqual(expectedResult);
		});
		it('should throw an error if owner ID is missing', async () => {
			await expect(
				controller.getApiKey({user: {}} as any, '1')
			).rejects.toThrow('Invalid credentials');
		});
	});
	describe('DeleteApiKey', () => {
		it('should delete an API key for ClusterAdmin role', async () => {
			const id = 'Key1';

			const expectedResult = {elementsDeleted: 1};
			const result = await controller.DeleteApiKey(
				{user: {role: UserRole.ClusterAdmin}} as any,
				id
			);

			expect(mockApiKeysService.deleteKey).toHaveBeenCalledWith(id);
			expect(result).toEqual(expectedResult);
		});
		it('should delete an API key for a specific owner', async () => {
			const id = 'Key2';
			const ownerId = 'noAdmin';
			const expectedResponse = { elementsDeleted: 1 };

			const result = await controller.DeleteApiKey(
				{user: {id: ownerId}} as any,
				id
			);

			expect(mockApiKeysService.deleteKey).toHaveBeenCalledWith(id, ownerId);
			expect(result).toEqual(expectedResponse);
		});
	});
});