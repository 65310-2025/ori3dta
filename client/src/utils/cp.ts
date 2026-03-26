import { ClientCPDto, ServerCPDto } from "../../../dto/dto";
import { CP, Edge, EdgeAssignment, Point } from "../types/cp";

export const convertServerCPDto = (serverCP: ServerCPDto): CP => {
  const vertices = serverCP.vertices_coords.map((point: [number, number]) => {
    return { x: point[0], y: point[1] };
  });

  const edges = serverCP.edges_vertices.map(
    (point: [number, number], index: number) => {
      return {
        vertex1: vertices[point[0]],
        vertex2: vertices[point[1]],
        assignment: serverCP.edges_assignment[index] as EdgeAssignment,
        foldAngle: serverCP.edges_foldAngle[index],
        id: crypto.randomUUID(),
      };
    },
  );

  return { vertices: vertices, edges: edges };
};

export const convertToClientCPDto = (cp: CP): ClientCPDto => {
  return {
    vertices_coords: cp.vertices.map((v) => [v.x, v.y]),
    edges_vertices: cp.edges.map((e) => [
      cp.vertices.indexOf(e.vertex1),
      cp.vertices.indexOf(e.vertex2),
    ]),
    edges_assignment: cp.edges.map((e) => e.assignment),
    edges_foldAngle: cp.edges.map((e) => e.foldAngle),
  };
};

export const getDefaultCP = () => {
  return convertServerCPDto({
    vertices_coords: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    edges_vertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
    edges_assignment: ["B", "B", "B", "B"],
    edges_foldAngle: [0, 0, 0, 0],
    _id: "",
  });
};

export const pointToKey = (point: Point) => {
  return `Point(${point.x},${point.y})`;
};

export const pointsEqual = (p1: Point, p2: Point) => {
  return p1.x === p2.x && p1.y === p2.y;
};

export const getOtherVertex = (e: Edge, v: Point) => {
  return pointsEqual(e.vertex1, v) ? e.vertex2 : e.vertex1;
};

export const isEndpoint = (e: { vertex1: Point; vertex2: Point }, p: Point) => {
  return pointsEqual(e.vertex1, p) || pointsEqual(e.vertex2, p);
};

export const flipAssignment = (assignment: EdgeAssignment) => {
  if (assignment === EdgeAssignment.Mountain) {
    return EdgeAssignment.Valley;
  }
  if (assignment === EdgeAssignment.Valley) {
    return EdgeAssignment.Mountain;
  }
  return assignment;
};
