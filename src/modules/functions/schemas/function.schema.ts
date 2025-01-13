import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Type } from 'class-transformer';

export type FunctionDocument = Function & Document;

@Schema({ timestamps: true }) 
export class Function {
  @Prop()
  function_type: string;

  @Prop()
  id: string;

  @Prop()
  version: string;

  @Prop()
  owner: string;

  @Prop()
  code_file_id: string;

  @Prop()
  outputs: string[];

  @Type(() => Date)
  @Prop()
  createdAt: Date;

  @Type(() => Date)
  @Prop()
  updatedAt: Date;
}

export const FunctionSchema = SchemaFactory.createForClass(Function);

FunctionSchema.index({ id: 1, version: 1, function_type: 1, owner: 1 }, { unique: true });