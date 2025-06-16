import {HttpException, HttpStatus, Injectable, Logger} from "@nestjs/common";
import {ApiKey, ApiKeyDocument} from "@common/auth/schemas/apikey.schema";
import {Model, Types} from "mongoose";
import {InjectModel} from "@nestjs/mongoose";
import {ResponseCreateApikeyDto} from "@common/auth/model/dto/response-create-apikey.dto";
import {DeleteResult} from "mongodb";
import {ApiKeyDTO} from "@common/auth/model/dto/apikey.dto";
import {ResponseDeleteDto} from "@common/auth/model/dto/response-delete.dto";
import {ResponseListApikeyDto} from "@common/auth/model/dto/response-list-apikey.dto";
import {UsersService} from "@modules/users/services/users.service";
import {ResponseApikeyDto} from "@common/auth/model/dto/response-apikey.dto";
import {ResponseUserDto} from "@modules/users/model/dto/response-user.dto";

@Injectable()
export class ApikeyService {
	private logger = new Logger('APIKeysService', { timestamp: true });

	constructor(
		@InjectModel(ApiKey.name) private readonly ApiKeyModel: Model<ApiKeyDocument>,
		private readonly usersService: UsersService) {
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

	async createKey(len: number, owner: string, name?: string): Promise<ResponseCreateApikeyDto> {
		const key = this.randomPass(len);
		const resp = await this.ApiKeyModel.create({key: key, name:name, owner: owner, createdAt: new Date()});

		return {
			id: resp.id,
			key: resp.key,
			name: resp.name,
			owner: resp.owner,
			createdAt: resp.createdAt,
		};
	}

	async deleteKey(id: string): Promise<ResponseDeleteDto> {
		const res = await this.ApiKeyModel.deleteOne({_id: id}).exec();
		return {
			elementsDeleted: res.deletedCount
		}
	}

	async validateApiKey(apiKey: string): Promise<boolean> {
		const resp = await this.ApiKeyModel.findOne({key: apiKey}).exec();
		return !!resp;
	}

	async getApiKey(id: string): Promise<ResponseApikeyDto> {
		const isObjectIdType = Types.ObjectId.isValid(id);
		const res = await this.ApiKeyModel.findOne({
			$or: [
				isObjectIdType?{ _id: id }:{},
				{ key: id },
				{ name: id }
			]
		}).exec();


		const key: ResponseApikeyDto = {
			id: res._id.toString(),
			key: res.key,
			name: res.name,
			owner: res.owner,
			role : null,
			createdAt: res.createdAt,
		};

		const owner = await this.usersService.getById(key.owner);
		if (owner) {
			key.owner = owner.email;
			key.role = owner.role;
		}
		return key;
	}

	async getUserByApiKey(id: string): Promise<ResponseUserDto> {
		const isObjectIdType = Types.ObjectId.isValid(id);
		const res = await this.ApiKeyModel.findOne({
			$or: [
				isObjectIdType?{ _id: id }:{},
				{ key: id },
				{ name: id }
			]
		}).exec();

		const owner = await this.usersService.getById(res.owner);
		return owner as ResponseUserDto;
	}

	async getApiKeys(offset: number, limit: number, owner?: string): Promise<ResponseListApikeyDto> {
		const total = await this.ApiKeyModel.countDocuments(owner?{owner:owner}:{}).exec();
		const result = await this.ApiKeyModel.find(owner?{owner:owner}:{}, { ['key']: 1, ['name']: 1, ['owner']: 1, ['createdAt']: 1, ['_id']: 1 })
				.limit(limit)
				.skip(offset)
				.exec();

		const items: ResponseApikeyDto[] = result.map(k => ({
			id: k._id.toString(),
			key: k.key,
			name: k.name,
			owner: k.owner,
			role : null,
			createdAt: k.createdAt,
		}));

		for (const item of items) {
			const owner = await this.usersService.getById(item.owner);
			if (owner) {
				item.owner = owner.email;
				item.role = owner.role;
			}
		}

		return {
			items,
			total,
			limit,
			offset
		};
	}



}