import {Controller, Logger, Post, Body, Put, Param, Get, Query, Delete} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiConsumes, ApiOkResponse, ApiQuery} from '@nestjs/swagger';
import {UsersService} from "@modules/users/services/users.service";
import {ResponseUserDto} from "@modules/users/model/dto/response-user.dto";
import {UserDTO} from "@modules/users/model/dto/user.dto";
import {ResponseValidateUserDto} from "@modules/users/model/dto/response-validate-user.dto";
import {ValidateUserDto} from "@modules/users/model/dto/validate-user.dto";
import {ResponseResetPasswordDto} from "@modules/users/model/dto/response-reset-password.dto";

@ApiTags('Admin')
@Controller('admin/user')
export class AdminUsersController {
	private logger = new Logger('AdminUsersController', { timestamp: true});

	constructor(private readonly usersService: UsersService) {}

	@Get('')
	@ApiOperation({
		summary: '',
		description: 'This service get a list of users. It respects the maximum number of users and the offset from the total list.'
	})
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
	})
	@ApiQuery({
		name: 'offset',
		required: false,
		type: Number,
	})
	async getUsers(
			@Query('offset') offset = 0,
			@Query('limit') limit = 10) {
		return this.usersService.getUsers(limit,offset);
	}

	@Post('')
	@ApiOperation({
		summary: '',
		description: 'This service creates a new user.'
	})
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	async createUser(@Body() eventData: UserDTO) {
		return this.usersService.createUser(eventData);
	}

	@Get('/:id')
	@ApiOperation({
		summary: '',
		description: 'This service gets user from id.'
	})
	@ApiOkResponse({ type: ResponseUserDto})
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	async findById(@Param('id') id: string) {
		return this.usersService.getById(id);
	}

	@Get('/search/:email')
	@ApiOperation({
		summary: '',
		description: 'This service gets user from email. If provided also uses password.'
	})
	@ApiOkResponse({ type: ResponseUserDto})
	@ApiQuery({
		name: 'password',
		required: false,
		type: String,
	})
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	async findByEmail(@Param('email') email: string, @Query('password') password = null) {
		if(password) return this.usersService.getByEmailAndPass(email,password);
		else return this.usersService.getByEmail(email);
	}

	@Put('/:email')
	@ApiOperation({
		summary: '',
		description: 'This service updates an existing user.'
	})
	@ApiOkResponse({ type: ResponseUserDto})
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	async updateUser(@Body() eventData: UserDTO, @Param('email') email: string) {
		return this.usersService.updateUser(eventData, email);
	}

	@Post('/validate/:email')
	@ApiOperation({
		summary: '',
		description: 'This service validates an existing user through its password.'
	})
	@ApiOkResponse({ type: ResponseValidateUserDto})
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	async validateUser(@Body() eventData: ValidateUserDto, @Param('email') email: string) {
		return this.usersService.validateUser(eventData, email);
	}

	@Delete('/:email')
	@ApiOperation({
		summary: '',
		description: 'This service deletes a user using its email.'
	})
	@ApiOkResponse({ type: ResponseValidateUserDto})
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	async deleteUser(@Param('email') email: string) {
		return this.usersService.deleteUser(email);
	}

	@Put('/reset/:email')
	@ApiOperation({
		summary: '',
		description: 'This service resets an existing user password.'
	})
	@ApiOkResponse({type: ResponseResetPasswordDto})
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	async resetPassword(@Param('email') email: string) {
		return this.usersService.resetUserPassword(email);
	}
}