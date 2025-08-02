import { Test, TestingModule } from '@nestjs/testing';
import {AdminUsersController} from "@modules/users/controllers/admin-users.controller";
import {UsersService} from "@modules/users/services/users.service";
import {ResponseUserDto} from "@modules/users/model/dto/response-user.dto";
import {UserRole} from "@modules/users/model/contract/user.interface";
import {UserDTO} from "@modules/users/model/dto/user.dto";
import {HttpException, HttpStatus} from "@nestjs/common";
import {UpdateUserDto} from "@modules/users/model/dto/update-user.dto";
import {ChangePasswordDto} from "@modules/users/model/dto/change-password.dto";

describe('AdminUsersController', () => {
  let controller: AdminUsersController;

	const oldUser: ResponseUserDto = {
		id: 'old-user-id',
		email: 'old-user@email.com',
		role: UserRole.ClusterAdmin,
		password: 'secret',
		createdAt: new Date(),
		updatedAt: new Date()
	}

	const mockUsersService = {
		getUsers: jest.fn((limit, offset) => {
			return {
				users: [oldUser],
				total: 1,
				limit,
				offset
			};
		}),
		getById: jest.fn((id) => {
			if (id === oldUser.id) {
				return oldUser;
			}
			throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		}),
		createUser: jest.fn((dto) => {
			return {
				id: 'new-user-id',
				email: dto.email,
				role: dto.role,
				password: '',
				createdAt: new Date(),
				updatedAt: new Date()
			};
		}),
		resetUserPassword: jest.fn((id) => {
			if (id !== oldUser.id) {
				throw new HttpException('User not found', HttpStatus.NOT_FOUND);
			}
			return { newPassword:'newPassword' };
		}),
		changeUserPassword: jest.fn((dto) => {
			return { ...oldUser };
		}),
		updateUser: jest.fn((dto, id) => {
			return { id, ...dto };
		}),
		deleteUser: jest.fn((id) => {
			if (id !== oldUser.id) {
				throw new HttpException('User not found', HttpStatus.NOT_FOUND);
			}
			return { count: 1 };
		})
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AdminUsersController],
			providers: [
				{
					provide: UsersService,
					useValue: mockUsersService,
				},
			],
		}).compile();

		controller = module.get<AdminUsersController>(AdminUsersController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('getUsers', () => {
		const offset = 0;
		const limit = 10;

		it('should call getUsers and return a list of users', async () => {
			const result = await controller.getUsers(offset, limit);
			const expectedResult = {
				users: [oldUser],
				total: 1,
				limit,
				offset
			};

			expect(result).toEqual(expectedResult);
			expect(mockUsersService.getUsers).toHaveBeenCalledWith(limit, offset);
		});
	});

	describe('createUser', () => {
		const newUser : UserDTO = {
			id: 'new-user-id',
			email: 'newUser@email.com',
			role: UserRole.ClusterAdmin,
			password: 'newPassword'
		}
		it('should call createUser and return the new user', async () => {
			const result = await controller.createUser(newUser);
			expect(result).toEqual({
				...newUser,
				password: expect.any(String),
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date)
			});
			expect(mockUsersService.createUser).toHaveBeenCalledWith(newUser);
		});
	});

	describe('findById', () => {
		it('should call findById and return a user by id', async () => {
			const userId = oldUser.id;
			const result = await controller.findById(userId);
			expect(result).toEqual(oldUser);
			expect(mockUsersService.getById).toHaveBeenCalledWith(userId);
		});
		it('should throw an error if user not found', async () => {
			const userId = 'non-existing-id';
			await expect(controller.findById(userId)).rejects.toThrow(HttpException);
			expect(mockUsersService.getById).toHaveBeenCalledWith(userId);
		});
	});

	describe('updateUserAdminData', () => {
		it('should call updateUserAdminData and return the updated user', async () => {
			const updateData: UpdateUserDto = {
				email: 'newEmail@email.com',
				role: UserRole.FunctionDeveloper,
				password: 'newPassword',
			};
			const userId = oldUser.id;
			const result = await controller.updateUserAdminData(updateData, userId);
			expect(result).toEqual({
				id: userId,
				...updateData,
			});
			expect(mockUsersService.updateUser).toHaveBeenCalledWith(updateData, userId);
		})
	})

	describe('updateUserAdminPass', () => {
		it('should call updateUserAdminPass and return the updated user', async () => {
			const changePasswordData: ChangePasswordDto = {
				password: 'newPassword',
			};
			const userId = oldUser.id;
			const result = await controller.updateUserAdminPass(changePasswordData, userId);
			expect(result).toEqual({
				...oldUser
			});
			expect(mockUsersService.changeUserPassword).toHaveBeenCalledWith(changePasswordData, userId);
		})
	})

	describe('deleteUser', () => {
		it('should call deleteUser and return the deleted user id', async () => {
			const userId = oldUser.id;
			const result = await controller.deleteUser(userId);
			expect(result).toEqual({ count: 1 });
			expect(mockUsersService.deleteUser).toHaveBeenCalledWith(userId);
		});

		it('should throw an error if user not found', async () => {
			const userId = 'non-existing-id';
			await expect(controller.deleteUser(userId)).rejects.toThrow(HttpException);
			expect(mockUsersService.deleteUser).toHaveBeenCalledWith(userId);
		});
	})

	describe('resetPassword', () => {
		it('should call resetPassword and return a reset link', async () => {
			const id = oldUser.id;
			const result = await controller.resetPassword(id);
			expect(result).toEqual({ newPassword: expect.any(String) });
			expect(mockUsersService.resetUserPassword).toHaveBeenCalledWith(id);
		});
		it('should throw an error if email not found', async () => {
			const id = 'noId';
			await expect(controller.resetPassword(id)).rejects.toThrow(HttpException);
			expect(mockUsersService.resetUserPassword).toHaveBeenCalledWith(id);
		});
	})
})