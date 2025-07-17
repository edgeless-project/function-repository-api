import {Module, SetMetadata} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule } from '@common/config/config.module';
import { ConfigService } from '@common/config/config.service';
import {UsersModule} from "@modules/users/users.module";
import {AdminAuthController} from "@common/auth/controllers/admin-auth.controller";
import {AuthService} from "@common/auth/services/auth.service";
import {ApikeyGard} from "@common/guards/apikey.gard";
import {ApiKeyStrategy} from "@common/auth/strategies/apiKey.strategy";
import {MongooseModule} from "@nestjs/mongoose";
import {ApiKey, ApiKeySchema} from "@common/auth/schemas/apikey.schema";
import {ApikeyService} from "@common/auth/services/apikey.service";
import {AccessGuard} from "@common/guards/access.guard";

@Module({
	imports: [
		UsersModule,
		MongooseModule.forFeature([{ name: ApiKey.name, schema: ApiKeySchema }]),
		PassportModule.register({ defaultStrategy: 'jwt' }),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => {
				return {
					secret: configService.get('JWT_SECRET_KEY'),
					signOptions: {
						audience: configService.get('JWT_AUDIENCE'),
						expiresIn: configService.get('JWT_EXPIRATION_LOGIN_TOKEN'),
					},
				};
			},
			inject: [ConfigService],
		}),
		ConfigModule,
	],
	controllers: [AdminAuthController],
	providers: [JwtStrategy, AuthService, AccessGuard, ApikeyGard, ApiKeyStrategy, ApikeyService],
	exports: [PassportModule, AccessGuard],
})
export class AuthModule {}