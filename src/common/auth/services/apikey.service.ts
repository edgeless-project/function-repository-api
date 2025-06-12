import {HttpException, HttpStatus, Injectable, Logger} from "@nestjs/common";
import {ApiKey, ApiKeyDocument} from "@common/auth/schemas/apikey.schema";
import {Model} from "mongoose";
import {InjectModel} from "@nestjs/mongoose";
import {ResponseCreateApikeyDto} from "@common/auth/model/dto/response-create-apikey.dto";
import {DeleteResult} from "mongodb";
import {ApiKeyDTO} from "@common/auth/model/dto/apikey.dto";
import {ResponseDeleteDto} from "@common/auth/model/dto/response-delete.dto";
import {ResponseListApikeyDto} from "@common/auth/model/dto/response-list-apikey.dto";

@Injectable()
export class ApikeyService {
	private logger = new Logger('UsersService', { timestamp: true });

	constructor(@InjectModel(ApiKey.name) private readonly ApiKeyModel: Model<ApiKeyDocument>,) {
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

	async createKey(len: number, owner: string): Promise<ResponseCreateApikeyDto> {
		const key = this.randomPass(len);
		const resp = await this.ApiKeyModel.create({key: key, owner: owner, createdAt: new Date()});
		return {
			id: resp.id,
			key: resp.key,
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

	async getApiKeys(offset: number, limit: number, owner?: string): Promise<ResponseListApikeyDto> {
		const total = await this.ApiKeyModel.countDocuments(owner?{owner:owner}:{}).exec();
		const result = await this.ApiKeyModel.find(owner?{owner:owner}:{}, { ['key']: 1, ['owner']: 1, ['createdAt']: 1, ['_id']: 1 })
				.limit(limit)
				.skip(offset)
				.exec();

		const items = result.map(k => ({
			id: k._id.toString(),
			key: k.key,
			owner: k.owner,
			createdAt: k.createdAt,
		}));

		return {
			items,
			total,
			limit,
			offset
		};
	}

}