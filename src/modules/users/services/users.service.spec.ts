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
			password: null,
			role: UserRole.ClusterAdmin,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: 'mock-2',
			email: 'mock2@email.com',
			password: null,
			role: UserRole.ClusterAdmin,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
	];

	const mockUsersModel = {
		exists: jest.fn((dto)=> ({
			exec: jest.fn(() => {
				const find = users.filter(user => {
					if (dto.email) return user.email === dto.email;
					else if (dto._id) return user.id === dto._id;
					else return false;
				});
				if (find.length > 0) return find[0].id;
				else return null;
			}),
		})),
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
		countDocuments: jest.fn(()=>{
			return {
				exec: jest.fn(() => {
					return users.length;
				}),
			};
		}),
		findById: jest.fn((id)=>({
			exec: jest.fn(() => {
				const user = users.find(u => u.id === id);
				if (user) {
					return {
						_id: user.id,
						email: user.email,
						password: null,
						role: user.role,
						createdAt: user.createdAt,
						updatedAt: user.updatedAt
					};
				} else {
					throw new HttpException('User not found', HttpStatus.NOT_FOUND);
				}
			})
		})),
		findOneAndUpdate: jest.fn((dto,set,state) => ({
			exec: jest.fn(() => {
				const user = users.find(u => u.id === dto._id);
				const data = set['$set'];
				if (user) {
					user.email = data.email || user.email;
					user.role = data.role || user.role;
					user.updatedAt = data.updatedAt || new Date();
					return {
						_id: user.id,
						email: user.email,
						password: null,
						role: user.role,
						createdAt: user.createdAt,
						updatedAt: user.updatedAt
					};
				} else {
					throw new HttpException('User not found', HttpStatus.NOT_FOUND);
				}
			})
		})),
		deleteOne: jest.fn((dto) => {
			const usr = users.filter(u => u.id != dto._id);
			const total = users.length - usr.length;
			return { deletedCount: total }
		}),
		findOne: jest.fn(dto => ({
				exec: jest.fn(() => {
					const user = users.find(u => u.email === dto.email);
					if (user) {
						return {
							_id: user.id,
							email: user.email,
							password: service['hashPassword']('password'),
							role: user.role,
							createdAt: user.createdAt,
							updatedAt: user.updatedAt
						};
					} else {
						throw new HttpException('User not found', HttpStatus.NOT_FOUND);
					}
				}),
		})),
		find: jest.fn(()=>{
			return {
				sort: jest.fn(() => {
						return {
							limit: jest.fn((limit) => {
								return {
									skip: jest.fn((offset) => {
										return {
											exec: jest.fn(() => {
												const result = users.slice(offset, offset + limit).map(w => ({
													_id: w.id,
													email: w.email,
													password: null,
													role: w.role,
													updatedAt: w.updatedAt,
													createdAt: w.createdAt
												}));
												return result;
											})
										};
									}),
								};
							}),
						};
					})
			}

		}),
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

	describe('getUsers', () => {
		it('should return a list of users with pagination', async () => {
			const limit = 10;
			const offset = 0;

			const result = await service.getUsers(limit, offset);
			expect(result).toEqual({
				users: users,
				total: users.length,
				limit,
				offset
			});
			expect(userModel.find).toHaveBeenCalledWith({});
			expect(userModel.countDocuments).toHaveBeenCalled();
		});

		it('should return an empty list of users with pagination', async () => {
			const limit = 10;
			const offset = 5;

			const result = await service.getUsers(limit, offset);
			expect(result).toEqual({
				users: [],
				total: users.length,
				limit,
				offset
			});
			expect(userModel.find).toHaveBeenCalledWith({});
			expect(userModel.countDocuments).toHaveBeenCalled();
		});

		it('should return a list of users wiht only one user cause of pagination', async () => {
			const limit = 1;
			const offset = 0;

			const result = await service.getUsers(limit, offset);
			expect(result).toEqual({
				users: [users[0]],
				total: users.length,
				limit,
				offset
			});
			expect(userModel.find).toHaveBeenCalledWith({});
			expect(userModel.countDocuments).toHaveBeenCalled();
		});
	});

	describe('getById', () => {
		it('should return a user by id', async () => {
			const userId = users[0].id;
			const result = await service.getById(userId);

			expect(result).toEqual({
				id: users[0].id,
				email: users[0].email,
				password: null,
				role: users[0].role,
				createdAt: users[0].createdAt,
				updatedAt: users[0].updatedAt
			});
			expect(userModel.findById).toHaveBeenCalledWith(userId);
		});

		it('should throw an error if user not found', async () => {
			const userId = 'non-existing-id';
			await expect(service.getById(userId)).rejects.toThrow(
				new HttpException(`User not found with id: ${userId}. HttpException: User not found`, HttpStatus.NOT_FOUND)
			);
			expect(userModel.findById).toHaveBeenCalledWith(userId);
		});
	});

	describe('getByEmail', () => {
		it('should return a user by email', async () => {
			const userEmail = users[0].email;
			const result = await service.getByEmail(userEmail);

			expect(result).toEqual({
				id: users[0].id,
				email: users[0].email,
				password: null,
				role: users[0].role,
				createdAt: users[0].createdAt,
				updatedAt: users[0].updatedAt
			});
			expect(userModel.findOne).toHaveBeenCalledWith({ email: userEmail });
		});
	});

	describe('getByEmailAndPass', () => {
		it('should return a user by email and password', async () => {
			const userEmail = users[0].email;
			const result = await service.getByEmailAndPass(userEmail, 'password');

			expect(result).toEqual({
				id: users[0].id,
				email: users[0].email,
				password: null,
				role: users[0].role,
				createdAt: users[0].createdAt,
				updatedAt: users[0].updatedAt
			});
			expect(userModel.findOne).toHaveBeenCalledWith({ email: userEmail });
		});

		it('should throw an error if user not found', async () => {
			const userEmail = 'non-existing-email';
			await expect(service.getByEmailAndPass(userEmail, 'password')).rejects.toThrow(
				new HttpException(`User not found with email: ${userEmail} and provided password. HttpException: User not found`, HttpStatus.NOT_FOUND)
			);
			expect(userModel.findOne).toHaveBeenCalledWith({ email: userEmail });
		});

		it('should throw an error if password incorrect', async () => {
			const userEmail = users[0].email;
			await expect(service.getByEmailAndPass(userEmail, 'non-password')).rejects.toThrow(
				new HttpException(`User not found with email: ${userEmail} and provided password. Error: Incorrect password.`, HttpStatus.NOT_FOUND)
			);
			expect(userModel.findOne).toHaveBeenCalledWith({ email: userEmail });
		});
	});

	describe('updateUser', () => {
		it('should update a user', async () => {
			const userId = users[0].id;
			const updateData = {
				email: 'mock1-new@email.com',
				role: UserRole.FunctionDeveloper,
				password: null,
			}
			const result = await service.updateUser(updateData, userId);
			const expectedResult: User = {
				id: users[0].id,
				email: updateData.email,
				password: null,
				role: UserRole.FunctionDeveloper,
				updatedAt: users[0].updatedAt,
				createdAt: users[0].createdAt,
			}

			expect(result).toEqual(expectedResult);
			expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
				{"_id":userId},
				{$set:
						{
							email: updateData.email,
							role: updateData.role,
							updatedAt: expect.any(Date),
						}
				},
				{ new: true }
			);

		})
	})

	describe('changePassword', () => {
		it('should change the password of a user', async () => {
			const userId = users[0].id;
			const newPassword = 'newPassword';
			const result = await service.changeUserPassword({password: newPassword}, userId);

			expect(result).toEqual({
				id: users[0].id,
				email: users[0].email,
				password: null,
				role: users[0].role,
				createdAt: users[0].createdAt,
				updatedAt: expect.any(Date),
			});
			expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
				{ _id: userId },
				{ $set: { password: expect.any(String), updatedAt: expect.any(Date) } },
				{ new: true }
			);
		});

		it('should throw an error if user not found', async () => {
			const userId = 'non-existing-id';
			const newPassword = 'newPassword';
			await expect(service.changeUserPassword({password: newPassword}, userId)).rejects.toThrow(
				new HttpException(`A user with the id: ${userId} does not exist.`, HttpStatus.NOT_FOUND)
			);
			expect(userModel.exists).toHaveBeenCalledWith(
				{ _id: userId }
			);
		});
	})

	describe('deleteUser', () => {
		it('should delete a user by id', async () => {
			const userId = users[0].id;
			const result = await service.deleteUser(userId);
			const expectedResult = { count: 1 };
			expect(result).toEqual(expectedResult);
			expect(userModel.deleteOne).toHaveBeenCalledWith({"_id": userId});
		});

		it('should delete 0 users if user not found', async () => {
			const userId = 'non-existing-id';
			const result = await service.deleteUser(userId);
			await expect(result).toEqual({count: 0});
			expect(userModel.deleteOne).toHaveBeenCalledWith({"_id": userId});
		});
	});

	describe('validateUser', () => {
		it('should validate a user by email and password', async () => {
			const userData = {
				email: users[0].email,
				password: 'password'
			};
			const result = await service.validateUser(userData, userData.email);

			expect(result).toEqual({
				email: users[0].email,
				validation: true
			});
			expect(userModel.findOne).toHaveBeenCalledWith({ email: userData.email });
		});

		it('should throw an error if user not found', async () => {
			const userEmail = {
				email: 'non-existing-email',
				password: 'password'
			};
			await expect(service.validateUser(userEmail, userEmail.email)).rejects.toThrow(
				new HttpException(`Error on validate user: ${userEmail.email}.`, HttpStatus.NOT_FOUND)
			);
			expect(userModel.findOne).toHaveBeenCalledWith({ email: userEmail.email });
		});
	})

});