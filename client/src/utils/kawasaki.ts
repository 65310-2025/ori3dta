/*
Kawasaki's theorem related utility functions

 - check if a particular vertex is foldable according to Kawasaki's theorem
 - check all vertices and find ones that are not foldable by Kawasaki
 - Find candidate creases for making a vertex foldable
*/
import { Fold } from "../types/fold";
import * as float from "./float";
import * as matrices from "./matrices";

function getRotationMatrices(
  fold: Fold,
  vertexIndex: number,
): null | { theta: number; rho: number; matrix: number[][] }[] {
  /*
    Get the rotation matrices for a particular vertex, sorted by theta. If the vertex is on the edge, return null
    Outputs a zip of thetas, foldAngles, and matrices
    */
  const vertex = fold.vertices_coords[vertexIndex];
  const connectedVertices = fold.vertices_vertices[vertexIndex]; //indices of connected vertices
  const connectedEdges = fold.vertices_edges[vertexIndex];
  const edge_assignments = connectedEdges.map(
    (edgeIndex) => fold.edges_assignment[edgeIndex],
  );
  const edge_foldAngles = connectedEdges.map(
    (edgeIndex) => fold.edges_foldAngle[edgeIndex],
  ); //assume radians

  //If the vertex is on the edge, kawasaki's theorem doesn't apply. "B" is border, "C" is cut (not commonly used)
  if (edge_assignments.includes("B") || edge_assignments.includes("C")) {
    return null;
  }

  //Convert connected vertices into thetas
  const thetas = connectedVertices.map((connectedVertexIndex) => {
    const connectedVertex = fold.vertices_coords[connectedVertexIndex];
    const x = connectedVertex[0] - vertex[0];
    const y = connectedVertex[1] - vertex[1];
    return Math.atan2(y, x);
  });

  // Sort thetas in ascending order and zip with edge_foldAngles
  const zipped = thetas
    .map((theta, index) => ({ theta, foldAngle: edge_foldAngles[index] }))
    .sort((a, b) => b.theta - a.theta);

  return zipped.map(({ theta, foldAngle }) => ({
    theta: theta,
    rho: foldAngle,
    matrix: matrices.rotationMatrix(theta, foldAngle),
  }));
}

//=========================================================
// 3D functions

export function checkKawasakiVertex(fold: Fold, vertexIndex: number): boolean {
  /*
    Check if a particular vertex is foldable by Kawasaki's theorem. This is a necessary condition, not sufficient. Returns true if foldable and false if not
    Should run in O(n) time where n is the number of connected vertices. In practice, n rarely exceeds 8 or so
    */

  if (!fold.vertices_coords || !fold.vertices_coords[vertexIndex]) {
    console.warn(`Vertex ${vertexIndex} is undefined or invalid`);
    return false;
  }
  const rotationMatrices = getRotationMatrices(fold, vertexIndex);
  if (rotationMatrices === null) {
    return true; //vertex IS foldable
  }

  //Multiply the rotation matrices
  const finalMatrix = matrices.multiplyMatricesList(
    rotationMatrices.map(({ matrix }) => matrix),
  );

  // Check if the final matrix is an identity matrix. Equivalent to checking if rotation vector is 0
  return matrices.isIdentity(finalMatrix);
}

export function makeKawasakiFoldable(
  fold: Fold,
  vertexIndex: number,
): Array<{ theta: number; rho: number }> | null {
  /*
    Check if a vertex can be made foldable by Kawasaki's theorem. If it can, return a list of candidate creases in the form of (theta, rho) that can be added to make it foldable. If not, or if it is already foldable, return null.
    */
  if (checkKawasakiVertex(fold, vertexIndex)) {
    return null; //vertex is already foldable
  }
  const rotationMatrices = getRotationMatrices(fold, vertexIndex);
  if (rotationMatrices === null) {
    return null; //vertex is on the edge, does not need to be made foldable
  }
  // console.log("Rotation matrices: ", rotationMatrices);
  //rotationMatrices is a circular list. Make n copies so that each copy starts with a different rotation matrix
  console.log("Rotation matrices: ", rotationMatrices);
  const n = rotationMatrices.length;
  const rotationMatricesCopies = Array.from({ length: n }, (_, index) => {
    return rotationMatrices
      .slice(index)
      .concat(rotationMatrices.slice(0, index));
  });
  //for each copy, multiply the matrices to get a net rotation
  const netMatrices = rotationMatricesCopies.map((rotationMatrices) =>
    matrices.multiplyMatricesList(rotationMatrices.map(({theta,rho, matrix }) => matrix)),
  );

  console.log("Net matrices: ", netMatrices);
  const candidateCreases: Array<{
    theta: number;
    rho: number;
    matrix: number[][];
  }> = [];
  //For each matrix in netMatrices, check if matrix[1][0] == matrix[0][1]. This means the rotation matrix has no z component, and can be expressed as a single crease
  // console.log("Net matrices: ", netMatrices);
  for (const matrix of netMatrices) {
    if (float.eq(matrix[1][0], matrix[0][1])) {
      //Find the theta and rho values of this single creases
      const theta = Math.atan2(matrix[2][1], matrix[0][2]); //really is the theta of the transpose, which is also the inverse
      const rho = Math.atan2(matrix[2][1] / Math.cos(theta), matrix[2][2]); //this is also the rho of the transpose
      candidateCreases.push({ theta: theta, rho: rho, matrix: matrix });
      candidateCreases.push({
        theta: theta >= 0 ? theta - Math.PI : theta + Math.PI,
        rho: -rho,
        matrix: matrix,
      }); //add the opposite solution
    }
  }
  console.log("Candidate creases: ", candidateCreases);
  //For each candidate crease, check if it actually makes the vertex foldable.
  let verifiedCreases: Array<{ theta: number; rho: number }> = [];

  for (const candidate of candidateCreases) {
    //insert the candidate
    const newRotationMatrices = rotationMatrices.concat(candidate);
    //sort by theta
    newRotationMatrices.sort((a, b) => a.theta - b.theta);
    // console.log(newRotationMatrices);
    //multiply matrices
    const finalMatrix = matrices.multiplyMatricesList(
      newRotationMatrices.map(({ matrix }) => matrix),
    );
    //check if the vertex with this candidate would be foldable
    // const rotationVector = matrices.rotationMatrixToVector(finalMatrix);
    // console.log(rotationVector);
    // console.log("======")
    // console.log(finalMatrix);
    if (matrices.isIdentity(finalMatrix)) {
      verifiedCreases.push({ theta: candidate.theta, rho: candidate.rho });
    }
  }
  // console.log("Verified creases: ", verifiedCreases);
  //Eliminate duplicate solutions
  //NOTE: might end up with both pi and -pi because maekawa/local self intersection is not implemented
  verifiedCreases = verifiedCreases.filter(
    (crease, index, self) =>
      index ===
      self.findIndex(
        (t) => float.eq(t.theta, crease.theta) && float.eq(t.rho, crease.rho),
      ),
  );
  return verifiedCreases;
}

export function angleDifference(a: number, b: number): number {
  /*
    Get the difference between two angles in radians. Returns a value between -pi and pi
    */
  const diff = a - b;
  return Math.atan2(Math.sin(diff), Math.cos(diff));
}
