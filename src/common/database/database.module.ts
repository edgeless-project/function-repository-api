import {Logger, Module, OnModuleInit} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';

import {ConfigModule} from '@common/config/config.module';
import {ConfigService} from '@common/config/config.service';
import {UsersService} from "@modules/users/services/users.service";
import {UsersModule} from "@modules/users/users.module";
import {UserDTO} from "@modules/users/model/dto/user.dto";
import {UserRole} from "@modules/users/model/contract/user.interface";

@Module({
	imports: [
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				uri: `mongodb://${config.databaseHost}:${config.databasePort}/${config.databaseName}`
			}),
		}),
		UsersModule,
	],
})
export class DatabaseModule implements OnModuleInit {
	private logger = new Logger('DatabaseModule', { timestamp: true });
	constructor(private readonly userService: UsersService,
	            private readonly configService: ConfigService) {}

	async onModuleInit() {
		const users = await this.userService.getUsers(1,0);
		if (users.total === 0) {
			const adminUser : UserDTO = {
				id: "",
				email: this.configService.dbDefaultUsername,
				password: this.configService.dbDefaultPassword,
				role: UserRole.ClusterAdmin
			}
			const result = await this.userService.createUser(adminUser);
			this.logger.log(`Database Users empty, default user created with id: ${result.id} and email ${result.email}`);
		}
	}
}
