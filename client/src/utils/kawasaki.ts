import { CP, EdgeAssignment, Point } from "../types/cp";
import { getOtherVertex, isEndpoint, pointsEqual } from "./cp";
import {
  Quaternion,
  isIdentityRotation,
  multiplyQuaternions,
} from "./quaternions";

export const checkVertexFoldable = (vertex: Point, cp: CP): boolean => {
  // Find all edges connected to this vertex
  const connectedEdges = cp.edges.filter((e) => isEndpoint(e, vertex));

  // If there are any border or cut edges connected, it's foldable (not constrained)
  if (
    connectedEdges.some(
      (e) =>
        e.assignment === EdgeAssignment.Border ||
        e.assignment === EdgeAssignment.Cut,
    )
  ) {
    return true;
  }

  // Filter for structural fold lines (Mountain and Valley, possibly Flat)
  // Ignoring Aux
  const foldEdges = connectedEdges.filter(
    (e) =>
      e.assignment === EdgeAssignment.Mountain ||
      e.assignment === EdgeAssignment.Valley ||
      e.assignment === EdgeAssignment.Flat,
  );

  if (foldEdges.length === 0) return true;

  // Gather theta and rho
  const edgeData = foldEdges.map((e) => {
    // Determine the vector pointing AWAY from the vertex
    const otherPoint = getOtherVertex(e, vertex);
    const dx = otherPoint.x - vertex.x;
    const dy = otherPoint.y - vertex.y;
    const theta = Math.atan2(dy, dx);
    const rho = e.foldAngle || 0; // foldAngle in radians
    return { theta, rho };
  });

  // Sort by theta
  edgeData.sort((a, b) => a.theta - b.theta);

  // Map to quaternions
  const quaternions: Quaternion[] = edgeData.map(({ theta, rho }) => {
    return [
      Math.cos(rho / 2),
      Math.sin(rho / 2) * Math.cos(theta),
      Math.sin(rho / 2) * Math.sin(theta),
      0,
    ];
  });

  // Multiply all quaternions in order
  let result = quaternions[0];
  for (let i = 1; i < quaternions.length; i++) {
    result = multiplyQuaternions(result, quaternions[i]);
  }

  return isIdentityRotation(result);
};
