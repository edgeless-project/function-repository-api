import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FunctionDocument = Function & Document;

@Schema() 
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
}

export const FunctionSchema = SchemaFactory.createForClass(Function);

FunctionSchema.index({ id: 1, version: 1, owner: 1 }, { unique: true });