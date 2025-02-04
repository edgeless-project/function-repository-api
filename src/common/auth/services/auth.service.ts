import {Body, Injectable, Param, Post, Put, UnauthorizedException} from '@nestjs/common';
import {UsersService} from "@common/users/services/users.service";
import {ValidateUserDto} from "@common/users/model/dto/validate-user.dto";

@Injectable()
export class AuthService {
	constructor(private usersService: UsersService) {}

	async validateUser(eventData: ValidateUserDto, username: string) {
		return this.usersService.validateUser(eventData, username);
	}
}