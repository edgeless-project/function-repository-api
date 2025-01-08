import {Injectable, InternalServerErrorException, Logger, NotAcceptableException} from '@nestjs/common';
import {CreateUserDto} from "@common/users/model/dto/create-user.dto";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {User, UserDocument} from "@common/users/schemas/user.schema";
import {UserDTO} from "@common/users/model/dto/user.dto";

@Injectable()
export class UsersService {
	private logger = new Logger('UsersService', { timestamp: true});

	constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

	async createUser(userData: CreateUserDto, owner: string) {

		// Check if there exists already a user with that username
		try {
			const resp = await this.userModel.exists({
				username: userData.username,
				owner
			});
			if (resp) throw new Error('User already exists');
		} catch {
			const msg = `A user with the name: ${userData.username} and owner: ${owner} already exists.`
			this.logger.error('createUser: ' + msg);
			throw new NotAcceptableException(msg);
		}

		try {
			const { username, password, email} = userData;
			const createdAt = new Date();
			const updatedAt = new Date();

			const result = await this.userModel.create({
				username: username,
				email: email,
				password: password,
				createdAt: createdAt,
				updatedAt: updatedAt,
			});

			const responseBody:User = {
				username: result.username,
				email: result.email,
				password: result.password,
				createdAt: result.createdAt,
				updatedAt: result.updatedAt,
				owner: result.owner,
			};

			this.logger.debug('createUser: responseBody',responseBody);

			return responseBody;

		} catch (err) {
			this.logger.error('createUser: ', err);
			throw new InternalServerErrorException();
		}
	}

	async findUserByEmail(email: string, owner: string) {
		let user:User;
		try {
			user = await this.userModel.findOne({
				email: email,
				owner
			}).exec();
		} catch {
			const msg = `Error on looking for email: ${email} and owner: ${owner}.`
			this.logger.error('findUserByEmail: ' + msg);
			throw new NotAcceptableException(msg);
		}
		return user?user:null;
	}

	async findUserByUsername(username: string, owner: string) {
		let user:User;
		try {
			user = await this.userModel.findOne({
				username: username,
				owner
			}).exec();
		} catch {
			const msg = `Error on looking for email: ${username} and owner: ${owner}.`
			this.logger.error('findUserByEmail: ' + msg);
			throw new NotAcceptableException(msg);
		}
		return user?user:null;
	}

	async updateUser(userData: UserDTO, username:string, owner: string) {
		let userId = null;
		// Check if there exists already a user with that username
		try {
			const resp = await this.userModel.exists({
				username: username,
				owner
			}).exec();
			if (resp) userId = resp
			else throw new Error('User does not exist');
		} catch {
			const msg = `A user with the name: ${userData.username} and owner: ${owner} does not exist.`
			this.logger.error('updateUser: ' + msg);
			throw new NotAcceptableException(msg);
		}
		try {
			const responseBody:User = await this.userModel.findOneAndUpdate({_id: userId, owner: owner}, {
				$set: {
					username: userData.username,
					email: userData.email,
					password: userData.password,
					updatedAt: new Date(),
				},
				new: true
			}).exec();
			return responseBody;
		}catch (e) {
			const msg = `A user with the name: ${userData.username} and owner: ${owner} could not be updated.`
			this.logger.error('updateUser: ' + msg);
			throw new NotAcceptableException(msg);
		}
	}
}
