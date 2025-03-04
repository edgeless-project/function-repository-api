import mongoose from "mongoose";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Type} from "class-transformer";

export type ApiKeyDocument = ApiKey & mongoose.Document;

@Schema({ timestamps: true })
export class ApiKey {

	_id: mongoose.Types.ObjectId;

	@Prop()
	key: string;

	@Prop()
	owner: string;

	@Type(() => Date)
	@Prop()
	createdAt: Date;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);

ApiKeySchema.index({ key: 1 }, { unique: true });