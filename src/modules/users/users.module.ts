import { Module } from '@nestjs/common';
import { UsersService } from "@modules/users/services/users.service";
import {ConfigModule} from "@common/config/config.module";
import {MongooseModule} from "@nestjs/mongoose";
import {User, UserSchema} from "@modules/users/schemas/user.schema";
import {AdminUsersController} from "@modules/users/controllers/admin-users.controller";


@Module({
	imports: [
		ConfigModule,
		MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
	],
	controllers: [AdminUsersController],
	providers: [UsersService],
	exports: [UsersService],
})
export class UsersModule {}
