import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '@modules/users/services/users.service';
import {User, UserDocument} from '@modules/users/schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';
import {UserRole} from "@modules/users/model/contract/user.interface";
import {UserDTO} from "@modules/users/model/dto/user.dto";
import {Model} from "mongoose";
import {HttpException, HttpStatus} from "@nestjs/common";

describe('UsersService', () => {
	let service: UsersService;
	let userModel: jest.Mocked<Model<UserDocument>>;

	let users: User[] = [
		{
			id: 'mock-1',
			email: 'mock1@email.com',
			password: '',
			role: UserRole.ClusterAdmin,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: 'mock-2',
			email: 'mock2@email.com',
			password: '',
			role: UserRole.ClusterAdmin,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
	];


	const mockUsersModel = {
		exists: jest.fn((dto)=>{
			const find = users.filter(user => user.email === dto.email);
			if (find.length > 0) return find[0].id;
			else return null;
		}),
		create: jest.fn((dto: User)=>{
			return {
				email: dto.email,
				password: null,
				role: dto.role,
				createdAt: new Date(),
				updatedAt: new Date(),
				_id: 'mock-'+dto.email,
			}
		}),
		findByIdAndUpdate: jest.fn(),
		findByIdAndDelete: jest.fn(),
		findOne: jest.fn(),
		find: jest.fn(),
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{
					provide: getModelToken(User.name),
					useValue: mockUsersModel,
				},
			],
		}).compile();

		service = module.get<UsersService>(UsersService);
		userModel = module.get(getModelToken(User.name));
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	it('should create a random password', () => {
		const password = service['randomPass'](12);
		expect(password).toBeDefined();
	});

	it('should create a hash password', () => {
		const password = 'testPassword';
		const hash = service['hashPassword'](password);
		expect(hash).toBeDefined();
		expect(hash).not.toEqual(password);
	});

	it('should check if a password and its hash are identical', () => {
		const password = service['randomPass'](12);
		const hash = service['hashPassword'](password);
		const isSame = service['isSamePassword'](password, hash);
		expect(isSame).toBeTruthy();
		expect(hash).toBeDefined();
		expect(hash).not.toEqual(password);
	});

	describe('createUser', () => {
		it('should create a user', async () => {
			const userData: UserDTO = {
				id:'',
				email: 'mock@email.com',
				password: 'password',
				role: UserRole.ClusterAdmin,
			};
			const result = await service.createUser(userData);
			const expectedResult = {
				id: 'mock-' + userData.email,
				email: userData.email,
				password: null,
				role: userData.role,
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date),
			}
			expect(result).toEqual(expectedResult);
			expect(userModel.exists).toHaveBeenCalledWith({ email: userData.email });
			expect(userModel.create).toHaveBeenCalledWith({
				email: userData.email,
				password: expect.any(String),
				role: userData.role,
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date),
			});
		});

		it('should throw an error if user already exists', async () => {
			const userData: UserDTO = {
				id: '',
				email: users[0].email,
				password: users[0].password,
				role: UserRole.ClusterAdmin,
			}
			await expect(service.createUser(userData)).rejects.toThrow(
				new HttpException(`Could not create the name: ${userData.email}. Error: User already exists`, HttpStatus.BAD_REQUEST)
			);
		});
	});

})