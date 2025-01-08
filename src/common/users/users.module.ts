import { Module } from '@nestjs/common';
import { UsersService } from "@common/users/services/users.service";
import {ConfigModule} from "@common/config/config.module";
import {MongooseModule} from "@nestjs/mongoose";
import {User, UserSchema} from "@common/users/schemas/user.schema";
import {AdminUsersController} from "@common/users/controllers/admin-users.controller";


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
