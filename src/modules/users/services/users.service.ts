import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {User, UserDocument} from "@modules/users/schemas/user.schema";
import {UserDTO} from "@modules/users/model/dto/user.dto";
import {ValidateUserDto} from "@modules/users/model/dto/validate-user.dto";
import {ResponseValidateUserDto} from "@modules/users/model/dto/response-validate-user.dto";
import {ResponseUserDto} from "@modules/users/model/dto/response-user.dto";
import {ResponseUsersListDTO} from "@modules/users/model/dto/response-users-list.dto";
import {ResponseDeleteUserDto} from "@modules/users/model/dto/response-delete-user.dto";
import {ResponseResetPasswordDto} from "@modules/users/model/dto/response-reset-password.dto";
import {UpdateUserDto} from "@modules/users/model/dto/update-user.dto";
import {ChangePasswordDto} from "@modules/users/model/dto/change-password.dto";

@Injectable()
export class UsersService {
	private logger = new Logger('UsersService', { timestamp: true });

	constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

	private hashPassword(password: string): string {
		return bcrypt.hashSync(password, 12).toString();
	}

	private isSamePassword(password: string, hasPassword: string): boolean {
		return bcrypt.compareSync(password, hasPassword);
	}

	private randomPass(length: number) {
		let result = '';
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const charactersLength = characters.length;
		let counter = 0;
		while (counter < length) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
			counter += 1;
		}
		return result;
	}

	async createUser(userData: UserDTO) {

		// Check if there exists already a user with that email
		try {
			const resp = await this.userModel.exists({
				email: userData.email
			}).exec();
			if (resp) throw new Error('User already exists');
		} catch (e) {
			const msg = `Could not create the name: ${userData.email}. ${e}`
			this.logger.error('createUser: ' + msg);
			throw new HttpException(msg, HttpStatus.BAD_REQUEST);
		}

		try {
			const { email, password, role} = userData;
			const createdAt = new Date();
			const updatedAt = new Date();
			const hashPassword = this.hashPassword(password);

			const result = await this.userModel.create({
				email: email,
				password: hashPassword,
				role: role,
				createdAt: createdAt,
				updatedAt: updatedAt,
			});

			const responseBody: ResponseUserDto = {
				id: result._id.toString(),
				email: result.email,
				password: null,
				role: result.role,
				createdAt: result.createdAt,
				updatedAt: result.updatedAt
			};
			this.logger.debug('createUser: responseBody',responseBody);

			return responseBody;

		} catch (err) {
			this.logger.error('createUser: ', err);
			throw new HttpException(`User could not be created. ${err}`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getById(id: string): Promise<User> {
		let user:User=null;
		try {
			const res = await this.userModel.findById(id).exec();
			user = {
				id: res._id.toString(),
				email: res.email,
				password: null,
				role: res.role,
				createdAt: res.createdAt,
				updatedAt: res.updatedAt,
			}
		} catch (e){
			const msg = `User not found with id: ${id}. ${e}`
			this.logger.error('getById: ' + msg);
			throw new HttpException(msg, HttpStatus.NOT_FOUND);
		}
		return user;
	}

	async getByEmail(email: string): Promise<User> {
		let user:User = null;
		try {
			const res = await this.userModel.findOne({
				email: email
			}).exec();
			user = {
				id: res._id.toString(),
				email: res.email,
				password: null,
				role: res.role,
				updatedAt: res.updatedAt,
				createdAt: res.createdAt,
			}

		} catch {
			const msg = `User not found with email: ${email}.`
			this.logger.error('getByEmail: ' + msg);
			throw new HttpException(msg, HttpStatus.NOT_FOUND);
		}
		return user;
	}

	async getByEmailAndPass(email: string, password: string): Promise<User> {
		let user:User = null;
		try {
			const res = await this.userModel.findOne({
				email: email
			}).exec();

			user = {
				id: res._id.toString(),
				email: res.email,
				password: null,
				role: res.role,
				updatedAt: res.updatedAt,
				createdAt: res.createdAt,
			}
			if(!this.isSamePassword(password, res.password)) {
				throw new Error('Incorrect password.');
			}
		} catch (e){
			const msg = `User not found with email: ${email} and provided password. ${e}`;
			this.logger.error('getByEmailAndPass: ' + msg);
			throw new HttpException(msg, HttpStatus.NOT_FOUND);
		}
		return user;
	}

	async updateUser(userData: UpdateUserDto, id:string): Promise<User> {

		let userId = null;
		// Check if there exists already a user with that email
		try {
			const resp = await this.userModel.exists({
				_id: id
			}).exec();
			if (resp) userId = resp
			else throw new Error('User does not exist');
		} catch (e){
			const msg = `A user with the id: ${id} does not exist.`
			this.logger.error('updateUser: ' + msg);
			throw new HttpException(msg, HttpStatus.NOT_FOUND);
		}

		let updateElements = {}
		if (userData.email) updateElements['email']=userData.email;
		if (userData.role) updateElements['role']=userData.role;
		updateElements['updatedAt'] = new Date();

		try {
			const res = await this.userModel.findOneAndUpdate({_id: userId}, {
				$set: updateElements
					},
					{new: true}
			).exec();

			return {
				id: res._id.toString(),
				email: res.email,
				password: null,
				role: res.role,
				updatedAt: res.updatedAt,
				createdAt: res.createdAt,
			}

		}catch (e) {
			let msg = `A user with the email ${userData.email} could not be updated. ${e}`;
			if (e.code === 11000) msg = `A user with the email ${userData.email} already exists, could not be updated.`;
			this.logger.error('updateUser: ' + msg);
			throw new HttpException(msg, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async changeUserPassword(userData: ChangePasswordDto, id:string): Promise<User> {
		if (!userData.password) {
			this.logger.error('changeUserPassword: Password is required');
			throw new Error('Password is required');
		}

		let userId = null;
		// Check if there exists already a user with that email
		try {
			const resp = await this.userModel.exists({
				_id: id
			}).exec();
			if (resp) userId = resp
			else throw new Error('User does not exist');
		} catch (e){
			const msg = `A user with the id: ${id} does not exist.`
			this.logger.error('updateUser: ' + msg);
			throw new HttpException(msg, HttpStatus.NOT_FOUND);
		}

		let updateElements = {}
		updateElements['password'] = this.hashPassword(userData.password);
		updateElements['updatedAt'] = new Date();

		try {
			const res = await this.userModel.findOneAndUpdate({_id: userId}, {
					$set: updateElements
				},
				{new: true}
			).exec();

			return {
				id: res._id.toString(),
				email: res.email,
				password: null,
				role: res.role,
				updatedAt: res.updatedAt,
				createdAt: res.createdAt,
			}

		}catch (e) {
			let msg = `A user with the email ${userId.email} could not be updated. ${e}`;
			this.logger.error('changeUserPassword: ' + msg);
			throw new HttpException(msg, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async validateUser(userData: ValidateUserDto, email: string): Promise<ResponseValidateUserDto> {
		let responseBody: ResponseValidateUserDto = {
			email: email,
			validation: false
		}
		try {
			let user = await this.getByEmailAndPass(email, userData.password);
			if (!user) {
				this.logger.debug(`validateUser: User ${email} was not found.`);
				return responseBody;
			}else
				responseBody.validation = true;

			this.logger.log(`validateUser: User ${email} has${responseBody.validation?'':' not'} been validated.`);
			return responseBody;

		}catch (e) {
			const msg = `Error on validate user: ${email}.`
			this.logger.error('validateUser: ' + msg);
			throw new HttpException(msg, HttpStatus.UNAUTHORIZED);
		}
	}

	async deleteUser(id: string): Promise<ResponseDeleteUserDto>{
		const responseBody: ResponseDeleteUserDto = {count:0};
		try {
			const res = await this.userModel.deleteOne({_id: id});
			responseBody.count = res.deletedCount;
			return responseBody;
		}catch (e) {
			const msg = `Could not find user ${id}. ${e}`;
			this.logger.error(`deleteUser: `+ msg);
			throw new HttpException(msg,HttpStatus.NOT_FOUND);
		}
	}

	async getUsers(limit:number, offset:number): Promise<ResponseUsersListDTO> {
		try {
			const total = await this.userModel.countDocuments().exec();
			const result = await this.userModel.find({})
				.sort({email:-1,createdAt:-1})
				.limit(limit)
				.skip(offset)
				.exec();
			const users: ResponseUserDto[] = result.map( w => ({
				id: w._id.toString(),
				email: w.email,
				password: null,
				role: w.role,
				updatedAt: new Date(w.updatedAt),
				createdAt: new Date(w.createdAt)
			}));

			return {
				users,
				total,
				limit,
				offset
			};

		}catch (e) {
			const msg = `Could not retrieve users. ${e}`;
			this.logger.error(`getUsers: `+ msg);
			throw new HttpException(msg,HttpStatus.NOT_FOUND);
		}
	}

	async resetUserPassword(id: string): Promise<ResponseResetPasswordDto>{
		try {
			const newPass = this.randomPass(12);
			const eventData = {password: newPass} as UpdateUserDto;
			await this.updateUser(eventData, id);
			return {
				newPassword: newPass
			};
		}catch (e) {
			const msg = `Could not change user password. ${e}`;
			this.logger.error(`resetUserPassword: `+ msg);
			throw new HttpException(msg, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

}
