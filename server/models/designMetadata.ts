import { Schema, model, Document } from "mongoose";

export interface IDbDesignMetadata extends Document {
  name: string;
  description: string;
  creatorID: string;
  dateLastModified: Date;
  dateCreated: Date;
  cpID: string;
}

const DesignMetadataSchema = new Schema<IDbDesignMetadata>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  creatorID: { type: String, required: true },
  dateLastModified: { type: Date, required: true },
  dateCreated: { type: Date, required: true },
  cpID: { type: String, required: true },
});

const DesignMetadata = model<IDbDesignMetadata>("DesignMetadata", DesignMetadataSchema);

export default DesignMetadata;
