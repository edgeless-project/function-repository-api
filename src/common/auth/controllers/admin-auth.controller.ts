import {ApiBearerAuth, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags} from "@nestjs/swagger";
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpException,
	HttpStatus,
	Logger,
	Param,
	Post, Req,
} from "@nestjs/common";
import {ResponseValidateUserDto} from "@modules/users/model/dto/response-validate-user.dto";
import {ValidateUserDto} from "@modules/users/model/dto/validate-user.dto";
import {AuthService} from "@common/auth/services/auth.service";
import {ResponseLoginDto} from "@common/auth/model/dto/response-login.dto";
import {Roles} from "@common/decorators/roles.decorator";
import {UserRole} from "@modules/users/model/contract/user.interface";

@ApiBearerAuth()
@ApiTags('Admin')
@Controller('admin/auth')
export class AdminAuthController {
	private logger = new Logger('AdminAuthController', {timestamp: true});
	constructor(private readonly authService: AuthService) {}

	@Post('/apikey/')
	@ApiOperation({
		summary: '',
		description: 'This service creates a valid API key'
	})
	async CreateApiKey(@Param('username') username: string) {
		throw new HttpException("Not implemented",HttpStatus.NOT_IMPLEMENTED);
	}

	@Delete('/apikey/:id')
	@ApiOperation({
		summary: '',
		description: 'This service deletes an existing API Key.'
	})
	async DeleteApiKey(@Param('id') id: string) {
		throw new HttpException("Not implemented",HttpStatus.NOT_IMPLEMENTED);
	}

	@Get('/apikey/get')
	@ApiOperation({
		summary: '',
		description: 'This service returns API Keys on demand.'
	})
	async GetApiKeys() {
		throw new HttpException("Not implemented",HttpStatus.NOT_IMPLEMENTED);
	}

	@Get('/get_me')
	@Roles(UserRole.AppDeveloper)
	@ApiOperation({
		summary: '',
		description: 'Get user information from token.'
	})
	async getMe(@Req() req) {
		if (req.user)
			return this.authService.getUser(req.user.email);
		else throw new HttpException("Request error", HttpStatus.BAD_REQUEST)
	}

	@Get('/refresh')
	@ApiOperation({
		summary: '',
		description: 'This service refresh a token.'
	})
	async refreshToken(@Req() req) {
		const email :string | undefined = req.user.email;
		const role:string | undefined = req.user.role;
		const permissions:string[] | undefined = req.user.permissions;
		if (!email) throw new HttpException("Request error", HttpStatus.BAD_REQUEST);
		return this.authService.refreshToken(email, role, permissions);
	}

	@Post('/login/:email')
	@ApiOperation({
		summary: '',
		description: 'This service returns an access token once the user is correctly logged in.'
	})
	@ApiOkResponse({ type: ResponseLoginDto })
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	async login(@Body() eventData: ValidateUserDto, @Param('email') email: string) {
		return this.authService.signIn(email, eventData.password);
	}

	@Get('/logout/')
	@ApiOperation({
		summary: '',
		description: 'This service deletes an API key once the user is correctly logged out.'
	})
	async logout() {
		throw new HttpException("Not implemented",HttpStatus.NOT_IMPLEMENTED);
	}

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
}