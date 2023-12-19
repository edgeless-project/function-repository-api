import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FunctionCodeDocument = FunctionCode & Document;

@Schema() 
export class FunctionCode {
  @Prop()
  mimetype: string;

  @Prop()
  originalname: string;

  @Prop()
  code: Buffer;
}

export const FunctionCodeSchema = SchemaFactory.createForClass(FunctionCode);