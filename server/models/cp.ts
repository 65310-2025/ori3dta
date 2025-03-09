import { Document, Schema, model } from "mongoose";

// TODO: Add fields
export interface ICP extends Document {}

const CPSchema = new Schema<ICP>({});

const CP = model<ICP>("CP", CPSchema);

export default CP;
