import { Schema, Prop, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { FunctionCode } from './function-code.schema';

export type FunctionTempCodeDocument = FunctionTempCode & Document;

@Schema() 
export class FunctionTempCode extends FunctionCode {
  @Prop(
    raw({
      default: () => new Date(Date.now() + 3600000), // 1 hour
      expires: 0,
      type: Date,
    }),
  )
  expiresAt: Date;
}

export const FunctionTempCodeSchema = SchemaFactory.createForClass(FunctionTempCode);