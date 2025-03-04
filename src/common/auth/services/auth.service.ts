import {
	HttpException,
	HttpStatus,
	Injectable, Logger, SetMetadata
} from '@nestjs/common';
import {UsersService} from "@modules/users/services/users.service";
import {ValidateUserDto} from "@modules/users/model/dto/validate-user.dto";
import {JwtService} from "@nestjs/jwt";
import {User} from "@modules/users/schemas/user.schema";
import {JwtPayload} from "@common/auth/model/interfaces/jwt-payload.interface";
import {ConfigService} from "@common/config/config.service";
import {UserDTO} from "@modules/users/model/dto/user.dto";
import {ResponseLoginDto} from "@common/auth/model/dto/response-login.dto";

@Injectable()
export class AuthService {
	private logger = new Logger('AuthService', { timestamp: true });
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService
		) {}


	async validateUser(eventData: ValidateUserDto, username: string) {
		return this.usersService.validateUser(eventData, username);
	}

	async signIn(email: string, password: string):Promise<ResponseLoginDto> {
		const response = await this.usersService.getByEmailAndPass(email, password);
		if (!response) throw new HttpException("Invalid Credentials",HttpStatus.UNAUTHORIZED);
		const payload:JwtPayload = {id: response.id, email: response.email, role: response.role};
		return {
			access_token: this.jwtService.sign(payload),
		}
	}

	async getUser(email: string): Promise<UserDTO> {
		const resp = await this.usersService.getByEmail(email);
		return {
			id: resp.id, email: resp.email, password: resp.password, role: resp.role
		};
	}

	async refreshToken(id: string, email: string, role? :string,permissions? :string[]):Promise<ResponseLoginDto> {
		if (!email) { throw new HttpException("Invalid Credentials",HttpStatus.UNAUTHORIZED); }
		const refreshPayload: JwtPayload = {id: id, email: email, role: role?role:'', permissions: permissions?permissions:[]};
		return {
			access_token: this.jwtService.sign(refreshPayload,
					{expiresIn: this.configService.get('JWT_EXPIRATION_REFRESH_TOKEN')}
			),
		}
	}
}