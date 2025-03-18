import { Document, Schema, model } from "mongoose";

// TODO: Add fields
export interface ICP extends Document {
  //Vertex index is implied by the order in the array
  //coordinates on the crease pattern. The default square varies from 0 to 1, although the user may use the file as a "notebook" with multiple crease patterns located around the plane. Note that older softwares define the default square from -200 to 200
  vertices_coords: Array<{
    x: number;
    y: number;
  }>;

  //Edge index is implied by the order in the array
  edges_vertices: Array<{
    vertex1: number;
    vertex2: number;
  }>;

  //should be same length as edge_vertices
  // "V", "M", "A", "B"
  //valley, mountain, aux, or border (paper edge/cut)
  //Can also include flat (F), cut (C) which is basically two borders, join (J) but these are less common
  edges_assignment: Array<string>;

  //Positive for valley, negative for mountain, 0 for everything else. Import and export as degrees [-180,180] but internally use radians [-pi,pi]. Should match with edges_assignment
  edges_foldAngle: Array<number>;
}

const CPSchema = new Schema<ICP>({
  vertices_coords: [
    {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
  ],
  edges_vertices: [
    {
      vertex1: { type: Number, required: true },
      vertex2: { type: Number, required: true },
    },
  ],
  edges_assignment: [{ type: String, required: true }],
  edges_foldAngle: [{ type: Number, required: true }],
});

const CP = model<ICP>("CP", CPSchema);

export default CP;
