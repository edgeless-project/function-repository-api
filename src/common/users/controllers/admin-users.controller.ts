import { Controller, Logger, Post, Body, Put, UseInterceptors, UploadedFile, Get, Param, Query, Delete, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiBadRequestResponse, ApiConsumes, ApiOkResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import {UsersService} from "@common/users/services/users.service";
import {ResponseUserDto} from "@common/users/model/dto/response-user.dto";
import {CreateUserDto} from "@common/users/model/dto/create-user.dto";
import {UserDTO} from "@common/users/model/dto/user.dto";

@ApiTags('Admin')
@Controller('admin/user')
export class AdminUsersController {
	private logger = new Logger('AdminUsersController', { timestamp: true});

	constructor(private readonly usersService: UsersService) {}

	@Post('')
	@ApiOperation({
		summary: '',
		description: 'This service creates a new user.'
	})
	@ApiOkResponse({ type: ResponseUserDto})
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	async createUser(@Body() eventData: CreateUserDto) {
		return this.usersService.createUser(eventData, "admin");
	}

	@Put(':username')
	@ApiOperation({
		summary: '',
		description: 'This service updates an existing user.'
	})
	@ApiOkResponse({ type: ResponseUserDto})
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	async updateUser(@Body() eventData: UserDTO, @Param('username') username: string) {
		return this.usersService.updateUser(eventData, username, "admin");
	}

}