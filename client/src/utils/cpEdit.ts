import { Fold } from "../types/fold";
import * as float from "./float";

// const TOLERANCE = 0.001; //tolerance to snap to vertices

export function createEdge(
  oldfold: Fold,
  v1: [number, number], //position of click start
  v2: [number, number], //position of click end
  foldAngle: number,
  assignment: string,
  TOLERANCE: number, //because tolerance is based on pixels
): { fold: Fold; affectedVertices: number[] } {
  const affectedVertices: number[] = []; //so the kawasaki checker doesn't need to check every vertex every time, only the recently affected ones

  if (coincidentVertices(v1, v2, TOLERANCE)) {
    return { fold: oldfold, affectedVertices };
  }

  const fold = structuredClone(oldfold);

  let v1index = -1;
  let v2index = -1;

  for (let i = 0; i < fold.vertices_coords.length; i++) {
    const distanceToV1 = distance(fold.vertices_coords[i], v1);
    if (
      distanceToV1 <= TOLERANCE &&
      (v1index === -1 ||
        distanceToV1 < distance(fold.vertices_coords[v1index], v1))
    ) {
      v1index = i;
    }
    const distanceToV2 = distance(fold.vertices_coords[i], v2);
    if (
      distanceToV2 <= TOLERANCE &&
      (v2index === -1 ||
        distanceToV2 < distance(fold.vertices_coords[v2index], v2))
    ) {
      v2index = i;
    }
  }

  if (v1index === -1) {
    v1index = fold.vertices_coords.length;
    fold.vertices_coords.push(v1);
    fold.vertices_vertices.push([]);
    fold.vertices_edges.push([]);
    for (let i = 0; i < fold.edges_vertices.length; i++) {
      const edge = fold.edges_vertices[i];
      if (
        vertexOnEdge(v1, {
          v1: fold.vertices_coords[edge[0]],
          v2: fold.vertices_coords[edge[1]],
        })
      ) {
        splitEdge(fold, i, v1index);
        break;
      }
    }
  }
  if (v2index === -1) {
    v2index = fold.vertices_coords.length;
    fold.vertices_coords.push(v2);
    fold.vertices_vertices.push([]);
    fold.vertices_edges.push([]);
    for (let i = 0; i < fold.edges_vertices.length; i++) {
      const edge = fold.edges_vertices[i];
      if (
        vertexOnEdge(v2, {
          v1: fold.vertices_coords[edge[0]],
          v2: fold.vertices_coords[edge[1]],
        })
      ) {
        splitEdge(fold, i, v2index);
        break;
      }
    }
  }

  const intersections: { index: number; v: [number, number] }[] = [];
  const coincidentEdges: number[] = [];
  affectedVertices.push(v1index);
  affectedVertices.push(v2index);

  // look for intersections with other vertices
  for (let i = 0; i < fold.vertices_coords.length; i++) {
    if (i === v1index || i === v2index) {
      continue;
    }
    const vertex = fold.vertices_coords[i];
    if (vertexOnEdge(vertex, { v1: v1, v2: v2 })) {
      intersections.push({ index: i, v: vertex });
      affectedVertices.push(i);
    }
  }

  for (let i = 0; i < fold.edges_vertices.length; i++) {
    const edge = fold.edges_vertices[i];

    if (fold.edges_assignment[i] === "A") {
      continue;
    }

    const edgev1 = fold.vertices_coords[edge[0]];
    const edgev2 = fold.vertices_coords[edge[1]];
    if (
      vertexOnEdge(edgev1, { v1: v1, v2: v2 }) &&
      vertexOnEdge(edgev2, { v1: v1, v2: v2 })
    ) {
      coincidentEdges.push(i);
      continue;
    }

    if (
      vertexOnEdge(edgev1, { v1: v1, v2: v2 }) ||
      vertexOnEdge(edgev2, { v1: v1, v2: v2 })
    ) {
      continue;
    }

    const intersection = findIntersection(
      { v1: v1, v2: v2 },
      { v1: edgev1, v2: edgev2 },
    );
    if (intersection) {
      fold.vertices_coords.push(intersection);
      fold.vertices_vertices.push([]);
      fold.vertices_edges.push([]);
      intersections.push({
        index: fold.vertices_coords.length - 1,
        v: intersection,
      });
      splitEdge(fold, i, fold.vertices_coords.length - 1);
      affectedVertices.push(fold.vertices_coords.length - 1);
    }
  }

  intersections.sort((a, b) => distance(v1, a.v) - distance(v1, b.v));
  // console.log(intersections);
  // console.log(coincidentEdges);

  if (intersections.length === 0) {
    connectVertices(
      fold,
      v1index,
      v2index,
      foldAngle,
      assignment,
      coincidentEdges,
    );
    return { fold, affectedVertices };
  }

  connectVertices(
    fold,
    v1index,
    intersections[0].index,
    foldAngle,
    assignment,
    coincidentEdges,
  );
  if (intersections.length != 1) {
    for (let i = 0; i < intersections.length - 1; i++) {
      connectVertices(
        fold,
        intersections[i].index,
        intersections[i + 1].index,
        foldAngle,
        assignment,
        coincidentEdges,
      );
    }
  }
  connectVertices(
    fold,
    intersections[intersections.length - 1].index,
    v2index,
    foldAngle,
    assignment,
    coincidentEdges,
  );

  return { fold, affectedVertices };
  // return fold;
}

export function deleteBox(
  oldfold: Fold,
  box: { min: [number, number]; max: [number, number] },
): Fold {
  const newFold = structuredClone(oldfold);
  const verticesToDelete: number[] = [];
  const edgesToDelete: number[] = [];

  //look for edges/vertices that are in the box
  for (let i = 0; i < newFold.vertices_coords.length; i++) {
    if (vertexInBox(newFold.vertices_coords[i], box)) {
      verticesToDelete.push(i);
    }
  }

  for (let i = 0; i < newFold.edges_vertices.length; i++) {
    if (
      lineThroughBox(
        newFold.vertices_coords[newFold.edges_vertices[i][0]],
        newFold.vertices_coords[newFold.edges_vertices[i][1]],
        box,
      )
    ) {
      edgesToDelete.push(i);
    }
  }

  // Remove edges that are connected to vertices that are being deleted
  for (const vertexIndex of verticesToDelete) {
    for (const edgeIndex of newFold.vertices_edges[vertexIndex]) {
      if (!edgesToDelete.includes(edgeIndex)) {
        edgesToDelete.push(edgeIndex);
      }
    }
  }
  //For all edges to be deleted, remove their vertices if those vertices have only one edge and aren't already in verticestodelete
  for (const edgeIndex of edgesToDelete) {
    const vertex1 = newFold.edges_vertices[edgeIndex][0];
    const vertex2 = newFold.edges_vertices[edgeIndex][1];
    if (
      newFold.vertices_edges[vertex1].length <= 1 &&
      !verticesToDelete.includes(vertex1)
    ) {
      verticesToDelete.push(vertex1);
    }
    if (
      newFold.vertices_edges[vertex2].length <= 1 &&
      !verticesToDelete.includes(vertex2)
    ) {
      verticesToDelete.push(vertex2);
    }
  }

  console.log("verticesToDelete", verticesToDelete);
  console.log("edgesToDelete", edgesToDelete);

  // Mark vertices and edges for deletion by setting them to null
  for (const vertexIndex of verticesToDelete) {
    newFold.vertices_coords[vertexIndex] = [NaN, NaN];
    newFold.vertices_vertices[vertexIndex] = [];
    newFold.vertices_edges[vertexIndex] = [];
  }
  for (const edgeIndex of edgesToDelete) {
    newFold.edges_vertices[edgeIndex] = [NaN, NaN];
    newFold.edges_assignment[edgeIndex] = "";
    newFold.edges_foldAngle[edgeIndex] = NaN;
  }


  // Remove all null entries from the arrays
  newFold.vertices_coords = newFold.vertices_coords.filter((v) => !isNaN(v[0]));
  newFold.vertices_vertices = newFold.vertices_vertices.filter(
    (v) => v.length > 0,
  );
  newFold.vertices_edges = newFold.vertices_edges.filter((v) => v.length > 0);
  newFold.edges_vertices = newFold.edges_vertices.filter((v) => !isNaN(v[0]));
  newFold.edges_assignment = newFold.edges_assignment.filter((v) => v !== "");
  newFold.edges_foldAngle = newFold.edges_foldAngle.filter((v) => !isNaN(v));

  //adjust indices
  newFold.edges_vertices = newFold.edges_vertices.map(([vertex1, vertex2]) => {
    const deletedBeforeVertex1 = verticesToDelete.filter((v) => v < vertex1).length;
    const deletedBeforeVertex2 = verticesToDelete.filter((v) => v < vertex2).length;
    return [vertex1 - deletedBeforeVertex1, vertex2 - deletedBeforeVertex2];
  });
  newFold.vertices_vertices = newFold.vertices_vertices.map((vertexIndices) =>
    vertexIndices.map((vertexIndex) => {
      const deletedBeforeVertex = verticesToDelete.filter(
        (v) => v < vertexIndex,
      ).length;
      return vertexIndex - deletedBeforeVertex;
    }),
  );
  newFold.vertices_edges = newFold.vertices_edges.map((edgeIndices) =>
    edgeIndices.map((edgeIndex) => {
      const deletedBeforeEdge = edgesToDelete.filter((v) => v < edgeIndex).length;
      return edgeIndex - deletedBeforeEdge;
    }),
  );

  console.log(newFold)
  return newFold;
}

export function findNearestCrease(fold:Fold, click:[number,number],tolerance:number):number {
  /*
  Given a click position, find the nearest crease to that position and return the crease's index. This is for changing the crease angle, so should only be returning creases whose assignment is M or V
  */
  let nearestCreaseIndex = -1;
  let minDistance = Infinity;

  for (let i = 0; i < fold.edges_vertices.length; i++) {
    if (fold.edges_assignment[i] !== "M" && fold.edges_assignment[i] !== "V") {
      continue;
    }

    const edge = fold.edges_vertices[i];
    const v1 = fold.vertices_coords[edge[0]];
    const v2 = fold.vertices_coords[edge[1]];

    const distanceToEdge = pointToLineDistance(click, v1, v2);
    if (distanceToEdge < minDistance && distanceToEdge < tolerance) {
      minDistance = distanceToEdge;
      nearestCreaseIndex = i;
    }
  }

  return nearestCreaseIndex;

}

export function findNearestVertex(fold:Fold, click:[number,number],tolerance:number):number {
  /*
  Given a click position, find the nearest vertex to that position and return the vertex's index.
  */
  let nearestVertexIndex = -1;
  let minDistance = Infinity;
  for (let i = 0; i < fold.vertices_coords.length; i++) {
    const vertex = fold.vertices_coords[i];
    const distanceToVertex = distance(click, vertex);
    if (distanceToVertex < minDistance && distanceToVertex < tolerance) {
      minDistance = distanceToVertex;
      nearestVertexIndex = i;
    }
  }
  return nearestVertexIndex;
}

function splitEdge(fold: Fold, edgeIndex: number, vertexIndex: number): void {
  const oldVertex1Index = fold.edges_vertices[edgeIndex][0];
  const oldVertex2Index = fold.edges_vertices[edgeIndex][1];

  fold.vertices_vertices[oldVertex2Index] = fold.vertices_vertices[
    oldVertex2Index
  ].filter((v) => (v != oldVertex1Index ? v : vertexIndex));
  fold.vertices_vertices[oldVertex1Index] = fold.vertices_vertices[
    oldVertex1Index
  ].filter((v) => (v != oldVertex2Index ? v : vertexIndex));
  fold.vertices_vertices[vertexIndex].push(oldVertex1Index);
  fold.vertices_vertices[vertexIndex].push(oldVertex2Index);

  fold.edges_vertices[edgeIndex][1] = vertexIndex;
  fold.edges_vertices.push([vertexIndex, oldVertex2Index]);
  fold.edges_assignment.push(fold.edges_assignment[edgeIndex]);
  fold.edges_foldAngle.push(fold.edges_foldAngle[edgeIndex]);

  fold.vertices_edges[oldVertex2Index] = fold.vertices_edges[
    oldVertex2Index
  ].map((v) => (v != edgeIndex ? v : fold.edges_vertices.length - 1));
  fold.vertices_edges[vertexIndex].push(fold.edges_vertices.length - 1);
  fold.vertices_edges[vertexIndex].push(edgeIndex);

  return;
}

function connectVertices(
  fold: Fold,
  v1index: number,
  v2index: number,
  foldAngle: number,
  assignment: string,
  coincidentEdges: number[],
): void {
  for (const coincident of coincidentEdges) {
    const v1 = fold.vertices_coords[v1index];
    const v2 = fold.vertices_coords[v2index];
    const coincidentv1 =
      fold.vertices_coords[fold.edges_vertices[coincident][0]];
    const coincidentv2 =
      fold.vertices_coords[fold.edges_vertices[coincident][1]];
    if (
      vertexOnEdge(v1, { v1: coincidentv1, v2: coincidentv2 }) &&
      vertexOnEdge(v2, { v1: coincidentv1, v2: coincidentv2 })
    ) {
      fold.edges_foldAngle[coincident] += foldAngle;
      if (fold.edges_foldAngle[coincident] > Math.PI) {
        fold.edges_foldAngle[coincident] -= 2 * Math.PI;
      } else if (fold.edges_foldAngle[coincident] < -Math.PI) {
        fold.edges_foldAngle[coincident] += 2 * Math.PI;
      }
      if (fold.edges_foldAngle[coincident] < 0) {
        fold.edges_assignment[coincident] = "M";
      } else if (fold.edges_foldAngle[coincident] > 0) {
        fold.edges_assignment[coincident] = "V";
      }
      return;
    }
  }
  fold.edges_vertices.push([v1index, v2index]);
  fold.edges_assignment.push(assignment);
  fold.edges_foldAngle.push(foldAngle);
  fold.vertices_vertices[v2index].push(v1index);
  fold.vertices_vertices[v1index].push(v2index);
  fold.vertices_edges[v2index].push(fold.edges_vertices.length - 1);
  fold.vertices_edges[v1index].push(fold.edges_vertices.length - 1);
}

function findIntersection(
  l1: { v1: [number, number]; v2: [number, number] },
  l2: { v1: [number, number]; v2: [number, number] },
): null | [number, number] {
  const { v1: p1, v2: p2 } = l1;
  const { v1: p3, v2: p4 } = l2;

  const det =
    (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]);

  if (det === 0) return null;

  const t =
    ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) /
    det;
  const u =
    ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) /
    det;

  if (t < 0 || t > 1 || u < 0 || u > 1) return null;

  return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
}

function vertexOnEdge(
  v: [number, number],
  l: { v1: [number, number]; v2: [number, number] },
): boolean {
  const d1 = Math.sqrt((v[0] - l.v1[0]) ** 2 + (v[1] - l.v1[1]) ** 2);
  const d2 = Math.sqrt((v[0] - l.v2[0]) ** 2 + (v[1] - l.v2[1]) ** 2);
  const d3 = Math.sqrt((l.v1[0] - l.v2[0]) ** 2 + (l.v1[1] - l.v2[1]) ** 2);
  return float.eq(d1 + d2, d3);
}

function coincidentVertices(
  v1: [number, number],
  v2: [number, number],
  tolerance: number,
): boolean {
  return (
    float.leq(Math.abs(v1[0] - v2[0]), tolerance) &&
    float.leq(Math.abs(v1[1] - v2[1]), tolerance)
  );
}

function distance(v1: [number, number], v2: [number, number]): number {
  return Math.sqrt((v1[0] - v2[0]) ** 2 + (v1[1] - v2[1]) ** 2);
}

function vertexInBox(
  v: [number, number],
  box: { min: [number, number]; max: [number, number] }, //min x, min y. max x, max y
): boolean {
  return (
    v[0] >= box.min[0] && 
    v[0] <= box.max[0] &&
    v[1] >= box.min[1] &&
    v[1] <= box.max[1]
  );
}
function lineThroughBox(
  v1: [number, number],
  v2: [number, number],
  box: { min: [number, number]; max: [number, number] },
): boolean {
  v1 = [v1[0], v1[1]]; // Ensure v1 is explicitly a tuple
  v2 = [v2[0], v2[1]]; // Ensure v2 is explicitly a tuple
  const boxLines = [
    { v1: box.min, v2: [box.max[0], box.min[1]] }, // Bottom edge
    { v1: [box.max[0], box.min[1]], v2: box.max }, // Right edge
    { v1: box.max, v2: [box.min[0], box.max[1]] }, // Top edge
    { v1: [box.min[0], box.max[1]], v2: box.min }, // Left edge
  ];

  for (const line of boxLines) {
    if (
      findIntersection(
        { v1, v2 },
        { v1: line.v1 as [number, number], v2: line.v2 as [number, number] },
      )
    ) {
      return true;
    }
  }

  return false;
}

function pointToLineDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number],
): number {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    // The line segment is a single point
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  // Calculate the projection of the point onto the line (parameterized by t)
  const t = ((px - x1) * dx + (py - y1) * dy) / (dx ** 2 + dy ** 2);

  if (t < 0) {
    // Closest point is lineStart
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  } else if (t > 1) {
    // Closest point is lineEnd
    return Math.sqrt((px - x2) ** 2 + (py - y2) ** 2);
  }

  // Closest point is on the line segment
  const projectionX = x1 + t * dx;
  const projectionY = y1 + t * dy;
  return Math.sqrt((px - projectionX) ** 2 + (py - projectionY) ** 2);
}