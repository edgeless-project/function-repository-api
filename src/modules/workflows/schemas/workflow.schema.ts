import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

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

@Schema() 
export class Workflow {
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
}

export const WorkflowSchema = SchemaFactory.createForClass(Workflow);