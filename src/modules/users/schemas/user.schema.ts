import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import mongoose from "mongoose";
import {UserRole} from "@modules/users/model/contract/user.interface";
import {IsEnum} from "class-validator";
import {ApiKeySchema} from "@common/auth/schemas/apikey.schema";

export type UserDocument = User & mongoose.Document;

@Schema({ timestamps: true })
export class User {

	@Prop()
	id: string;

	@Prop()
	email: string;

	@Prop()
	password: string;

	@Prop({
		type: String,
		enum: UserRole,
		default: UserRole.AppDeveloper
	})
	@IsEnum(UserRole)
	role: UserRole;

	@Type(() => Date)
	@Prop()
	createdAt: Date;

	@Type(() => Date)
	@Prop()
	updatedAt: Date;
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1}, { unique: true });

UserSchema.pre(['deleteOne', 'deleteMany', 'findOneAndDelete'], async function () {
	if (this instanceof mongoose.Query) {
		const document = await this.model.findOne(this.getQuery());
		const ApiKeys = this.model.db.model('apikeys', ApiKeySchema);
		await ApiKeys.deleteMany({ owner: document._id.toString() });
	}
});

export {UserSchema};