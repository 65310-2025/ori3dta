/**
 * Type definitions for information transfer between frontend and backend
 */
export interface UserDto {
  _id: string;
  name: string;
  googleid: string;
}

// sent from server -> client to load the library
export interface DesignMetadataDto {
  _id: string;
  name: string;
  description: string;
  creatorID: string;
  creatorName: string;
  dateLastModified: Date;
  dateCreated: Date;
  cpID: string;
}

export interface CPDto {
  _id: string;
  vertices_coords: Array<{
    x: number;
    y: number;
  }>;
  edges_vertices: Array<{
    vertex1: number;
    vertex2: number;
  }>;
  edges_assignment: Array<string>;
  edges_foldAngle: Array<number>;
}

// sent from client -> server to create a new design
export interface NewDesignDto {
  name: string;
  description: string;
}
