import {
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiOkResponse,
	ApiOperation,
	ApiQuery,
	ApiTags
} from "@nestjs/swagger";
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpException,
	HttpStatus,
	Logger,
	Param,
	Post, Query, Req,
} from "@nestjs/common";
import {ValidateUserDto} from "@modules/users/model/dto/validate-user.dto";
import {AuthService} from "@common/auth/services/auth.service";
import {ResponseLoginDto} from "@common/auth/model/dto/response-login.dto";
import {ApikeyService} from "@common/auth/services/apikey.service";
import {OptionalParseIntPipe} from "@common/pipes/optional-parse-int.pipe";
import {ResponseCreateApikeyDto} from "@common/auth/model/dto/response-create-apikey.dto";
import {ResponseDeleteDto} from "@common/auth/model/dto/response-delete.dto";
import {ResponseListApikeyDto} from "@common/auth/model/dto/response-list-apikey.dto";
import {UserDTO} from "@modules/users/model/dto/user.dto";
import {Roles, IS_API_KEY} from "@common/decorators/roles.decorator";
import {UserRole} from "@modules/users/model/contract/user.interface";
import {Public} from "@common/decorators/public.decorator";
import {jwtPayloadRequest} from "@common/auth/model/interfaces/jwt-payload.interface";

@ApiBearerAuth()
@ApiTags('Admin')
@Controller('admin/auth')
export class AdminAuthController {
	private logger = new Logger('AdminAuthController', {timestamp: true});
	constructor(
			private readonly authService: AuthService,
			private readonly apikeyService: ApikeyService) {}

	@Get('/apikey/')
	@Roles(...Object.values(UserRole))
	@ApiOperation({
		summary: '',
		description: 'This service returns the existing API Keys on demand. Can be filtered by owner ID.'
	})
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
	@ApiQuery({
		name: 'owner',
		required: false,
		type: String,
	})
	@ApiOkResponse({type:ResponseListApikeyDto})
	async GetApiKeys(
			@Req() req : jwtPayloadRequest,
			@Query('offset', new OptionalParseIntPipe('0')) offset: number,
			@Query('limit', new OptionalParseIntPipe('10')) limit: number,
	) {
		if (req.user?.role == UserRole.ClusterAdmin) {
			return this.apikeyService.getApiKeys(offset, limit);
		}else if (req.user?.id) {
			return this.apikeyService.getApiKeys(offset, limit, req.user.id);
		}else return this.apikeyService.getApiKeys(offset, 0);
	}

	@Post('/apikey/')
	@Roles(...Object.values(UserRole))
	@ApiOperation({
		summary: '',
		description: 'This service creates a valid API key and register that key under the owner ID.'
	})
	@ApiQuery({
		name: 'name',
		required: false,
		type: String,
	})
	@ApiOkResponse({ type: ResponseCreateApikeyDto })
	async CreateApiKey(@Req() req: jwtPayloadRequest, @Body('name') name?: string) {
		const owner = req.user?.id
		if (!owner) {throw new HttpException("Invalid credentials", HttpStatus.UNAUTHORIZED); }
		return this.apikeyService.createKey(32, owner, name);
	}

	@Post('/apikey/get')
	@Roles(...Object.values(UserRole))
	@ApiOperation({
		summary: '',
		description: 'This service gets an API key.'
	})
	@ApiQuery({
		name: 'id',
		required: true,
		type: String,
	})
	@ApiOkResponse({ type: ResponseCreateApikeyDto })
	async getApiKey(@Req() req: jwtPayloadRequest, @Body('id') id: string) {
		const owner = req.user?.id
		if (!owner) {throw new HttpException("Invalid credentials", HttpStatus.UNAUTHORIZED); }
		if (req.user?.role == UserRole.ClusterAdmin) {
			return this.apikeyService.getApiKey(id);
		}else
			return this.apikeyService.getApiKey(id, owner);

	}

	@Delete('/apikey/:id')
	@Roles(...Object.values(UserRole))
	@ApiOperation({
		summary: '',
		description: 'This service deletes an existing API Key.'
	})
	@ApiOkResponse({type:ResponseDeleteDto})
	async DeleteApiKey(@Req() req: jwtPayloadRequest, @Param('id') id: string) {
		if (req.user?.role == UserRole.ClusterAdmin) {
			return this.apikeyService.deleteKey(id);
		}else
			return this.apikeyService.deleteKey(id, req.user?.id);
	}

	@Get('/info')
	@Roles(...Object.values(UserRole))
	@ApiOperation({
		 summary: '',
		 description: 'Get user information from token.'
	})
	@ApiOkResponse({type:UserDTO})
	async getMe(@Req() req: jwtPayloadRequest) {
		const email = req.user?.email;
		if (!email) throw new HttpException("Request error", HttpStatus.BAD_REQUEST)
		return this.authService.getUser(req.user.email);
	}

	@Post('/refresh')
	@Roles(...Object.values(UserRole))
	@ApiOperation({
		summary: '',
		description: 'This service refreshes a token and returns the new access token.'
	})
	@ApiOkResponse({type:ResponseLoginDto})
	async refreshToken(@Req() req: jwtPayloadRequest) {
		const id :string | undefined = req.user?.id;
		const email :string | undefined = req.user?.email;
		const role:string | undefined = req.user?.role;
		const permissions:string[] | undefined = req.user?.permissions;
		if (!email || !id) throw new HttpException("Request error", HttpStatus.BAD_REQUEST);
		return this.authService.refreshToken(id, email, role, permissions);
	}

	@Post('/login')
	@Public()
	@ApiOperation({
		summary: '',
		description: 'This service returns an access token once the user is correctly logged in.'
	})
	@ApiOkResponse({ type: ResponseLoginDto })
	@ApiConsumes('application/json', 'application/x-www-form-urlencoded')
	async login(@Body() eventData: ValidateUserDto) {
		return this.authService.signIn(eventData.email, eventData.password);
	}

	@Get('/logout/')
	@ApiOperation({
		summary: '',
		description: 'This service ensures the user is correctly logged out.'
	})
	async logout() {
		throw new HttpException("Not implemented",HttpStatus.NOT_IMPLEMENTED);
	}
}