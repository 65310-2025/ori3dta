/*
Inputs a crease pattern as a fold object. Calculates the folded coordinates of the vertices and outputs the fold object with the folded coordinates.

Note: often origami designers will use a file as a "notebook" rather than a single crease pattern. This means that the xray function may need to take a selection of a FOLD file rather than the whole thing. This can be handled later by having the select tool create a temporary FOLD object with only the selected vertices and edges, and this temporary object is what gets passed into this function.


*/
import { Fold } from "../../server/types/fold";

export function getFaces(oldfold: Fold): Fold {
  /*
    Compute the faces based on the vertices and edges. Fill out all the face fields: faces_vertices, faces_edges, faces_faces

    - clone the edges_vertices list, flipping the directions. combine to form a list of directional half-edges.

    - for each vertex, make a list of outgoing half-edges. sort by theta.

    - until the list of half-edges is empty: pick a half-edge v1 -> v2. In v2's list of outgoing edges, find the next one in theta order, v2 -> v3. Continue until you return to the first half-edge. For each edge, add to faces_edges, add the vertices to faces_vertices, and remove the half-edge from the list of half-edges.
    */
  const fold = structuredClone(oldfold);
  fold.faces_vertices = [];
  fold.faces_edges = [];
  fold.faces_faces = [];
  fold.edges_faces = Array.from({ length: fold.edges_vertices.length }, () => ({
    left: null,
    right: null,
  }));
  // fold.vertices_faces = [] //Don't think this one is necessary

  const N = fold.edges_vertices.length;
  let halfEdges: {
    vertex1: number;
    vertex2: number;
    fullEdge: number;
    index: number;
  }[] = structuredClone(fold.edges_vertices).map(
    ({ vertex1, vertex2 }, index) => ({
      vertex1: vertex1,
      vertex2: vertex2,
      fullEdge: index,
      index: index,
    }),
  );

  halfEdges = halfEdges.concat(
    halfEdges.map(({ vertex1, vertex2, fullEdge }) => ({
      vertex1: vertex2,
      vertex2: vertex1,
      fullEdge: fullEdge,
      index: fullEdge + N,
    })),
  ); //should be 2N long

  //outgoing half edges from each vertex
  let vertices_outgoingEdges: {
    vertex1: number;
    vertex2: number;
    fullEdge: number;
    index: number;
  }[][] = Array.from({ length: fold.vertices_coords.length }, () => []);
  for (const halfEdge of halfEdges) {
    vertices_outgoingEdges[halfEdge.vertex1].push(halfEdge);
  }
  // sort vertices_outgoingEdges by angle
  vertices_outgoingEdges = vertices_outgoingEdges.map((edges, vindex) =>
    edges.sort(
      (halfEdgeA, halfEdgeB) =>
        angle(vindex, halfEdgeA.vertex2, fold) -
        angle(vindex, halfEdgeB.vertex2, fold),
    ),
  );

  const mutableHalfEdges = structuredClone(halfEdges);
  while (mutableHalfEdges.length > 0) {
    const face_vertices: number[] = [];
    const face_edges: number[] = [];

    let currentHalfEdge = mutableHalfEdges[0];
    mutableHalfEdges.shift();

    face_vertices.push(currentHalfEdge.vertex1);
    face_edges.push(currentHalfEdge.fullEdge);

    while (true) {
      const nextVertex: number = currentHalfEdge.vertex2;
      const outgoingEdges: {
        vertex1: number;
        vertex2: number;
        fullEdge: number;
        index: number;
      }[] = vertices_outgoingEdges[nextVertex];

      //index in the list of outgoingEdges
      const currentOutgoingIndex = outgoingEdges.findIndex(
        (halfEdge) => halfEdge.vertex2 == currentHalfEdge.vertex1,
      );

      currentHalfEdge =
        outgoingEdges[
          currentOutgoingIndex < outgoingEdges.length - 1
            ? currentOutgoingIndex + 1
            : 0
        ];

      face_vertices.push(currentHalfEdge.vertex1);
      face_edges.push(currentHalfEdge.fullEdge);
      const indexToRemove = mutableHalfEdges.findIndex(
        (halfEdge) =>
          halfEdge.vertex1 === currentHalfEdge.vertex1 &&
          halfEdge.vertex2 === currentHalfEdge.vertex2,
      );
      if (indexToRemove !== -1) {
        mutableHalfEdges.splice(indexToRemove, 1);
      }

      if (currentHalfEdge.vertex2 === face_vertices[0]) {
        break;
      }
    }
    //One of the faces will be tracing the outside of the cp. We can find it and avoid adding it because its orientation will be different.
    if (!isFaceClockwise(face_vertices, fold)) {
      fold.faces_vertices.push(face_vertices);
      fold.faces_edges.push(face_edges);
    }
  }

  //Fill out edges_faces
  fold.faces_edges.forEach((edges, faceIndex) => {
    edges.forEach((edgeIndex) => {
      const edgeFaces = fold.edges_faces[edgeIndex];
      if (edgeFaces.left === null) {
        edgeFaces.left = faceIndex;
      } else {
        edgeFaces.right = faceIndex;
      }
    });
  });
  //Fill out faces_faces
  const faceCount = fold.faces_vertices.length;
  fold.faces_faces = Array.from({ length: faceCount }, () => []);
  fold.edges_faces.forEach(({ left, right }) => {
    if (left !== null && right !== null) {
      fold.faces_faces[left].push(right);
      fold.faces_faces[right].push(left);
    }
  });

  return fold;
}

// export function xray(cp:Fold,root_index:number = 0){
//     /*
//     - Create spanning tree, starting from the root_index face. store tree data externally?
//     - for each face, vertices will start at cp position, reflect over edges until reach the root face, and then store as folded coords. will be redundant but polynomial time
//     */
// }

//=====
//math helper functions

function angle(vertex1: number, vertex2: number, fold: Fold): number {
  /*
    Takes two vertex indices. Computes the angle of the vector v1 -> v2 with respect to the x axis.
    */
  return Math.atan2(
    fold.vertices_coords[vertex2].y - fold.vertices_coords[vertex1].y,
    fold.vertices_coords[vertex2].x - fold.vertices_coords[vertex1].x,
  );
}

function isFaceClockwise(vertices: number[], fold: Fold): boolean {
  let sum = 0;
  for (let i = 0; i < vertices.length; i++) {
    const { x: x1, y: y1 } = fold.vertices_coords[vertices[i]];
    const { x: x2, y: y2 } =
      fold.vertices_coords[vertices[(i + 1) % vertices.length]];
    sum += (x2 - x1) * (y2 + y1);
  }
  return sum < 0;
}
