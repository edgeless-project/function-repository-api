import {ResponseUserDto} from "@common/users/model/dto/response-user.dto";
import {IsOptional} from "class-validator";
import {ObjectId} from "mongodb";


export class CreateUserDto extends ResponseUserDto{
	@IsOptional()
	_id: ObjectId;
}