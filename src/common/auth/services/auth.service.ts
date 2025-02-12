import {
	HttpException,
	HttpStatus,
	Injectable
} from '@nestjs/common';
import {UsersService} from "@modules/users/services/users.service";
import {ValidateUserDto} from "@modules/users/model/dto/validate-user.dto";
import {JwtService} from "@nestjs/jwt";
import {User} from "@modules/users/schemas/user.schema";
import {JwtPayload} from "@common/auth/model/interfaces/jwt-payload.interface";
import {ConfigService} from "@common/config/config.service";

@Injectable()
export class AuthService {
	constructor(
			private readonly usersService: UsersService,
			private readonly jwtService: JwtService,
			private readonly configService: ConfigService
			) {}

	async validateUser(eventData: ValidateUserDto, username: string) {
		return this.usersService.validateUser(eventData, username);
	}

	async signIn(email: string, password: string):Promise<{access_token: string}> {
		const response = await this.usersService.getByEmailAndPass(email, password);
		if (!response) throw new HttpException("Invalid Credentials",HttpStatus.UNAUTHORIZED);
		const payload:JwtPayload = {email: response.email, role: response.role};
		return {
			access_token: this.jwtService.sign(payload),
		}
	}

	async getUser(email: string): Promise<User> {
		const resp = await this.usersService.getByEmail(email);
		return resp;
	}

	async refreshToken(email: string, role? :string,permissions? :string[]) {
		if (!email) { throw new HttpException("Invalid Credentials",HttpStatus.UNAUTHORIZED); }
		const refreshPayload = {email: email, role: role?role:'', permissions: permissions?permissions:[]};
		return {
			refresh_token: this.jwtService.sign(refreshPayload,
					{expiresIn: this.configService.get('JWT_EXPIRATION_REFRESH_TOKEN')}
			),
		}

	}

}