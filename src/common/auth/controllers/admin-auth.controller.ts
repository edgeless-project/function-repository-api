import {ApiConsumes, ApiOkResponse, ApiOperation, ApiTags} from "@nestjs/swagger";
import {Body, Controller, Delete, Get, HttpException, HttpStatus, Logger, Param, Post, Put} from "@nestjs/common";
import {ResponseValidateUserDto} from "@modules/users/model/dto/response-validate-user.dto";
import {ValidateUserDto} from "@modules/users/model/dto/validate-user.dto";
import {AuthService} from "@common/auth/services/auth.service";


@ApiTags('Admin')
@Controller('admin/auth')
export class AdminAuthController {
	private logger = new Logger('AdminAuthController', {timestamp: true});
	constructor(private readonly authService: AuthService) {}

	@Post('/validate/:username')
	@ApiOperation({
		summary: '',
		description: 'This service validates an existing user.'
	})
	@ApiOkResponse({ type: ResponseValidateUserDto})
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	async validateUser(@Body() eventData: ValidateUserDto, @Param('username') username: string) {
		return this.authService.validateUser(eventData, username);
	}

	@Post('/ApiKey/')
	@ApiOperation({
		summary: '',
		description: 'This service creates a valid API key'
	})
	async CreateApiKey(@Param('username') username: string) {
		throw new HttpException("Not implemented",HttpStatus.NOT_IMPLEMENTED);
	}

	@Delete('/ApiKey/:id')
	@ApiOperation({
		summary: '',
		description: 'This service deletes an existing API Key.'
	})
	async DeleteApiKey(@Param('id') id: string) {
		throw new HttpException("Not implemented",HttpStatus.NOT_IMPLEMENTED);
	}

	@Get('/ApiKey/')
	@ApiOperation({
		summary: '',
		description: 'This service returns API Keys on demand.'
	})
	async GetApiKeys() {
		throw new HttpException("Not implemented",HttpStatus.NOT_IMPLEMENTED);
	}

	@Get('/ApiKey/')
	@ApiOperation({
		summary: '',
		description: 'This service refresh a token.'
	})
	async refreshToken() {
		throw new HttpException("Not implemented",HttpStatus.NOT_IMPLEMENTED);
	}

	@Post('/login/')
	@ApiOperation({
		summary: '',
		description: 'This service returns an API key once the user is correctly logged in.'
	})
	async login() {
		throw new HttpException("Not implemented",HttpStatus.NOT_IMPLEMENTED);
	}

	@Get('/login/')
	@ApiOperation({
		summary: '',
		description: 'This service deletes an API key once the user is correctly logged out.'
	})
	async logout() {
		throw new HttpException("Not implemented",HttpStatus.NOT_IMPLEMENTED);
	}

}