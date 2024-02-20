import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Type } from 'class-transformer';

export type WorkflowDocument = Workflow & mongoose.Document;

class WorkflowFunction {
  @Prop()
  name: string;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'Function'
  })
  class_specification: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    default: {}
  })
  output_mapping: any;

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    default: {}
  })
  annotations: any;
}

@Schema({ timestamps: true }) 
export class Workflow {
  @Prop()
  name: string;

  @Prop()
  owner: string;
  
  @Prop()
  functions: WorkflowFunction[];

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    default: {}
  })
  resources: any;

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    default: {}
  })
  annotations: any;

  @Type(() => Date)
  @Prop()
  createdAt: Date;

  @Type(() => Date)
  @Prop()
  updatedAt: Date;
}

export const WorkflowSchema = SchemaFactory.createForClass(Workflow);

WorkflowSchema.index({ name: 1, owner: 1 }, { unique: true });