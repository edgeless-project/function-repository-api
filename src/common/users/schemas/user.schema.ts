import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import mongoose from "mongoose";

export type UserDocument = User & mongoose.Document;

@Schema({ timestamps: true })
export class User {

	@Prop()
	username: string;

	@Prop()
	email: string;

	@Prop()
	password: string;

	@Prop()
	owner: string;

	@Type(() => Date)
	@Prop()
	createdAt: Date;

	@Type(() => Date)
	@Prop()
	updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ username: 1, owner:1 }, { unique: true });