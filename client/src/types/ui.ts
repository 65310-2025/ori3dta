export enum MvMode {
  Mountain = "M",
  Valley = "V",
  Border = "B",
  Aux = "A",
}

export enum Mode {
  Selecting = "selecting", // select, open inspector window
  Drawing = "drawing", // simple line draw
  Deleting = "deleting", // box delete
  ChangeMV = "changmv", // box change mv
}

export interface ViewBox {
  x: number;
  y: number;
  zoom: number;
}

export interface GridSettings {
  showGrid: boolean;
  gridSize: number;
  extendGrid: boolean;
}

export const defaultGridSettings = {
  showGrid: false,
  gridSize: 8,
  extendGrid: false,
};
