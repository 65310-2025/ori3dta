import { CP, Edge, Point } from "../types/cp";
import { Face, FoldedFace, Point3D } from "../types/xray";
import { getOtherVertex, pointToKey, pointsEqual } from "./cp";
import { getEdgeAngle } from "./geometry";

const DISTORTION = 0.001; // how much to distort the face when folding

const getDirectedEdgeKey = (v1: Point, v2: Point) => {
  return `Edge${pointToKey(v1)}-${pointToKey(v2)}`;
};

const isFaceClockwise = (face: Point[]): boolean => {
  const sum = face
    .map((p1: Point, ind: number) => {
      const p2 = face[(ind + 1) % face.length];
      return p1.x * p2.y - p2.x * p1.y;
    })
    .reduce((acc: number, curr: number) => acc + curr);
  return sum < 0;
};

const traceFace = (
  startVertex: Point,
  startEdge: Edge,
  edgeMap: Map<string, Edge[]>,
  usedEdges: Set<string>,
): Face => {
  const face: Point[] = [];
  const edges: Edge[] = [];
  let currentVertex = startVertex;
  let currentEdge = startEdge;

  do {
    // Get next vertex
    const nextVertex = getOtherVertex(currentEdge, currentVertex);
    face.push(nextVertex);
    edges.push(currentEdge);

    // Mark edge as used
    usedEdges.add(getDirectedEdgeKey(currentVertex, nextVertex));

    // Find next edge (next counter-clockwise edge)
    const edgesAtVertex = edgeMap.get(pointToKey(nextVertex))!;
    const currentIndex = edgesAtVertex.findIndex(
      (e) => e.id === currentEdge.id,
    );

    // Get the next edge in counter-clockwise order
    const nextIndex = (currentIndex + 1) % edgesAtVertex.length;
    currentEdge = edgesAtVertex[nextIndex];
    currentVertex = nextVertex;
  } while (!pointsEqual(currentVertex, startVertex));

  return { border: face, edges: edges, id: crypto.randomUUID() };
};

export const findFaces = (cp: CP): Face[] => {
  // 1. Build adjacency structure
  const edgeMap = new Map<string, Edge[]>();
  const pointMap = new Map<string, Point>();

  cp.vertices.forEach((v) => {
    const key = pointToKey(v);
    edgeMap.set(key, []);
    pointMap.set(key, v);
  });

  cp.edges.forEach((edge) => {
    const key1 = pointToKey(edge.vertex1);
    const key2 = pointToKey(edge.vertex2);
    edgeMap.get(key1)!.push(edge);
    edgeMap.get(key2)!.push(edge);
  });

  // 2. Sort edges around each vertex by angle
  edgeMap.forEach((edges, vertexKey) => {
    const vertex = pointMap.get(vertexKey);
    if (!vertex) {
      throw `Vertex ${vertexKey} not found in pointMap!`;
    }
    edges.sort((a, b) => {
      const angleA = getEdgeAngle(a, vertex);
      const angleB = getEdgeAngle(b, vertex);
      return angleA - angleB;
    });
  });

  // 3. Traverse to find faces
  const faces: Face[] = [];
  const usedEdges = new Set<string>();

  cp.edges.forEach((edge) => {
    // Try both directions
    [edge.vertex1, edge.vertex2].forEach((startVertex) => {
      const edgeKey = getDirectedEdgeKey(
        startVertex,
        getOtherVertex(edge, startVertex),
      );

      if (usedEdges.has(edgeKey)) return;

      const face = traceFace(startVertex, edge, edgeMap, usedEdges);
      if (face.border.length >= 3 && isFaceClockwise(face.border)) {
        faces.push(face);
      }
    });
  });

  return faces;
};

const rotateFace = (
  face: Point3D[],
  edge: Edge,
  flip: number = 1,
): Point3D[] => {
  const { vertex1: A, vertex2: B } = edge;

  const axis = [B.x - A.x, B.y - A.y, 0];

  const axisLength = Math.hypot(axis[0], axis[1], axis[2]);
  if (axisLength === 0) throw new Error("Edge points must be different.");

  const u = axis.map((v) => v / axisLength);

  const angle = edge.foldAngle * (1 - DISTORTION) * flip;
  const cosTheta = Math.cos(angle);
  const sinTheta = Math.sin(angle);

  return face.map((p: Point3D) => {
    const pRel = [p[0] - A.x, p[1] - A.y, p[2]];

    const cross = [
      u[1] * pRel[2] - u[2] * pRel[1],
      u[2] * pRel[0] - u[0] * pRel[2],
      u[0] * pRel[1] - u[1] * pRel[0],
    ];

    const dot = u[0] * pRel[0] + u[1] * pRel[1] + u[2] * pRel[2];

    // Rodrigues' rotation formula
    const rotated = [
      A.x +
        cosTheta * pRel[0] +
        sinTheta * cross[0] +
        (1 - cosTheta) * dot * u[0],
      A.y +
        cosTheta * pRel[1] +
        sinTheta * cross[1] +
        (1 - cosTheta) * dot * u[1],
      cosTheta * pRel[2] + sinTheta * cross[2] + (1 - cosTheta) * dot * u[2],
    ];

    return rotated as Point3D;
  });
};

interface FaceEdge {
  face: Face;
  edge: Edge;
}

const shouldFlip = (face: Face, edge: Edge) => {
  const v1Ind = face.border.findIndex((p: Point) =>
    pointsEqual(p, edge.vertex1),
  );
  const v2Ind = face.border.findIndex((p: Point) =>
    pointsEqual(p, edge.vertex2),
  );
  return (v2Ind - v1Ind + face.border.length) % face.border.length !== 1;
};

export const foldFaces = (faces: Face[], cp: CP): FoldedFace[] => {
  // Calculate spanning tree
  const edgeFaces = new Map<Edge, Face[]>();

  cp.edges.forEach((e: Edge) => edgeFaces.set(e, []));
  faces.forEach((f: Face) =>
    f.edges.forEach((e: Edge) => edgeFaces.get(e)!.push(f)),
  );

  const faceAdj = new Map<Face, FaceEdge[]>();
  faces.forEach((f: Face) => faceAdj.set(f, []));
  edgeFaces.forEach((fs: Face[], edge: Edge) => {
    if (fs.length === 2) {
      faceAdj.get(fs[0])!.push({ face: fs[1], edge: edge });
      faceAdj.get(fs[1])!.push({ face: fs[0], edge: edge });
    }
  });

  const faceParent = new Map<Face, FaceEdge | null>();
  const facesVisited = new Set<Face>();
  const dfsFaces = (face: Face, from: FaceEdge | null = null) => {
    faceParent.set(face, from);
    facesVisited.add(face);
    faceAdj.get(face)!.forEach((e: FaceEdge) => {
      if (facesVisited.has(e.face)) return;
      dfsFaces(e.face, { ...e, face: face });
    });
  };
  dfsFaces(faces[0]);

  return faces.map((f: Face) => {
    let curFace = f;
    let points = f.border.map((p: Point) => [p.x, p.y, 0] as Point3D);
    let par;
    while ((par = faceParent.get(curFace))) {
      const flip = shouldFlip(curFace, par.edge) ? -1 : 1;
      points = rotateFace(points, par.edge, flip);
      curFace = par.face;
    }
    return { border: points, id: f.id };
  });
};
