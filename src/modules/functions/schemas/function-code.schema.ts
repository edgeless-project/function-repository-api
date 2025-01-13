import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema() 
export class FunctionCode {
  @Prop()
  mimetype: string;

  @Prop()
  originalname: string;

  @Prop()
  code: Buffer;
}