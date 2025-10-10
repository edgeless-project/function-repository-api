import {
	Controller,
	Logger,
	Post,
	Body,
	Put,
	Param,
	Get,
	Query,
	Delete,
	Req,
	HttpException,
	HttpStatus
} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiConsumes, ApiOkResponse, ApiQuery, ApiBearerAuth} from '@nestjs/swagger';
import {UsersService} from "@modules/users/services/users.service";
import {ResponseUserDto} from "@modules/users/model/dto/response-user.dto";
import {UserDTO} from "@modules/users/model/dto/user.dto";
import {ResponseResetPasswordDto} from "@modules/users/model/dto/response-reset-password.dto";
import {ResponseUsersListDTO} from "@modules/users/model/dto/response-users-list.dto";
import {Roles} from "@common/decorators/roles.decorator";
import {UserRole} from "@modules/users/model/contract/user.interface";
import {ChangePasswordDto} from "@modules/users/model/dto/change-password.dto";
import {UpdateUserDto} from "@modules/users/model/dto/update-user.dto";
import {ResponseDeleteUserDto} from "@modules/users/model/dto/response-delete-user.dto";
import {jwtPayloadRequest} from "@common/auth/model/interfaces/jwt-payload.interface";
import {CreateUserDTO} from "@modules/users/model/dto/create-user.dto";

@ApiBearerAuth()
@ApiTags('Admin')
@Controller('user')
export class AdminUsersController {
	private logger = new Logger('AdminUsersController', { timestamp: true});

	constructor(private readonly usersService: UsersService) {}

	@Get('')
	@Roles(UserRole.ClusterAdmin)
	@ApiOperation({
		summary: '',
		description: 'This service get a list of users. It respects the maximum number of users and the offset from the total list.' +
				'Only a Cluster Admin can list users data.'
	})
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	@ApiOkResponse({type:ResponseUsersListDTO})
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
	@Roles(UserRole.ClusterAdmin)
	@ApiOperation({
		summary: '',
		description: 'This service creates a new user. Only a Cluster Admin can create users.'
	})
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	@ApiOkResponse({type:ResponseUserDto})
	async createUser(@Body() eventData: CreateUserDTO) {
		return this.usersService.createUser(eventData);
	}

	@Get('/:id')
	@Roles(UserRole.ClusterAdmin)
	@ApiOperation({
		summary: '',
		description: 'This service gets a user from an id. Only a Cluster Admin can get users data.'
	})
	@ApiOkResponse({ type: UserDTO})
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	async findById(@Param('id') id: string) {
		return this.usersService.getById(id);
	}

	@Put('/update/:id')
	@Roles(UserRole.ClusterAdmin)
	@ApiOperation({
		summary: '',
		description: 'This allows a cluster admin to update an existing user. Email and role are the fields that ' +
				'can be updated. Only a Cluster Admin can update users.'
	})
	@ApiOkResponse({ type: ResponseUserDto })
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	async updateUserAdminData(@Body() eventData: UpdateUserDto, @Param('id') id: string) {
		return this.usersService.updateUser(eventData, id);
	}

	@Put('/password/:id')
	@Roles(UserRole.ClusterAdmin)
	@ApiOperation({
		summary: '',
		description: 'This service changes the password from an existing user. Only a Cluster Admin can change a users password.'
	})
	@ApiOkResponse({ type: ResponseUserDto })
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	async updateUserAdminPass(@Body() eventData: ChangePasswordDto, @Param('id') id: string) {
		const user_passwd: UpdateUserDto = eventData as UpdateUserDto;
		return this.usersService.changeUserPassword(user_passwd, id);
	}

	@Put('/change_password')
	@Roles(UserRole.ClusterAdmin, UserRole.FunctionDeveloper, UserRole.AppDeveloper)
	@ApiOperation({
		summary: '',
		description: 'This service changes the users password. Any user can change its password.'
	})
	@ApiOkResponse({ type: ResponseUserDto })
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	async updateUser(@Body() eventData: ChangePasswordDto, @Req() req: jwtPayloadRequest) {
		const user_passwd: UpdateUserDto = eventData as UpdateUserDto;
		const id = req.user?.id;
		if (!id) throw new HttpException("Request error",HttpStatus.BAD_REQUEST);
		return this.usersService.changeUserPassword(user_passwd, id);
	}

	@Delete('/:id')
	@Roles(UserRole.ClusterAdmin)
	@ApiOperation({
		summary: '',
		description: 'This service deletes a user using its ID. Only a Cluster Admin can delete users.'
	})
	@ApiOkResponse({ type: ResponseDeleteUserDto})
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	async deleteUser(@Param('id') id: string) {
		return this.usersService.deleteUser(id);
	}

	@Put('/reset/:id')
	@Roles(UserRole.ClusterAdmin, UserRole.FunctionDeveloper, UserRole.AppDeveloper)
	@ApiOperation({
		summary: '',
		description: 'This service resets the password if a user. It does use a randomized password. Any user can reset its password.'
	})
	@ApiOkResponse({type: ResponseResetPasswordDto})
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	async resetPassword(@Param('id') id: string) {
		return this.usersService.resetUserPassword(id);
	}
}