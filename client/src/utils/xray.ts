import { CP, Edge, Point } from "../types/cp";
import { Face, FoldedFace, Point3D } from "../types/xray";
import { getOtherVertex, pointToKey, pointsEqual } from "./cp";

const DISTORTION = 0.001; // how much to distort the face when folding


const getSignedArea = (points: Point[]): number => {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    area += (p1.x * p2.y - p2.x * p1.y);
  }
  return area / 2;
};

const getDirectedEdgeKey = (v1: Point, v2: Point) => {
  return `Edge${pointToKey(v1)}-${pointToKey(v2)}`;
};

const getEdgeAngle = (e: Edge, reference: Point): number => {
  const other = getOtherVertex(e, reference);
  return Math.atan2(other.y - reference.y, other.x - reference.x);
};

// const isFaceClockwise = (face: Point[]): boolean => {
//   const sum = face
//     .map((p1: Point, ind: number) => {
//       const p2 = face[(ind + 1) % face.length];
//       return p1.x * p2.y - p2.x * p1.y;
//     })
//     .reduce((acc: number, curr: number) => acc + curr);
//   return sum < 0;
// };
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
    const nextVertex = getOtherVertex(currentEdge, currentVertex);
    face.push(nextVertex);
    edges.push(currentEdge);

    usedEdges.add(getDirectedEdgeKey(currentVertex, nextVertex));

    const edgesAtVertex = edgeMap.get(pointToKey(nextVertex));
    if (!edgesAtVertex) throw new Error("Graph disjointed: Vertex not found in edge map.");

    const currentIndex = edgesAtVertex.findIndex((e) => e.id === currentEdge.id);
    if (currentIndex === -1) throw new Error("Graph disjointed: Edge missing from vertex.");

    // THE FIX: Use - 1 to make "Left Turns" (Counter-Clockwise traversal)
    // We add edgesAtVertex.length before modulo to handle negative numbers in JS
    const nextIndex = (currentIndex - 1 + edgesAtVertex.length) % edgesAtVertex.length;
    
    currentEdge = edgesAtVertex[nextIndex];
    currentVertex = nextVertex;
  } while (!pointsEqual(currentVertex, startVertex));

  return { border: face, edges: edges, id: crypto.randomUUID() };
};

export const findFaces = (cp: CP): Face[] => {
  // 1. Filter out non-structural lines
  let activeEdges = cp.edges.filter(
    (e: any) => e.assignment !== "A" && e.assignment !== "F"
  );

  // 2. Iteratively merge collinear edges (Robustly decoupled from cp.vertices)
  let changed = true;
  while (changed) {
    changed = false;
    
    // Dynamically map vertices strictly from current activeEdges
    const vMap = new Map<string, Edge[]>();
    const vPoints = new Map<string, Point>();
    
    activeEdges.forEach((e) => {
      const k1 = pointToKey(e.vertex1);
      const k2 = pointToKey(e.vertex2);
      if (!vMap.has(k1)) { vMap.set(k1, []); vPoints.set(k1, e.vertex1); }
      if (!vMap.has(k2)) { vMap.set(k2, []); vPoints.set(k2, e.vertex2); }
      vMap.get(k1)!.push(e);
      vMap.get(k2)!.push(e);
    });

    for (const [vKey, edges] of vMap.entries()) {
      if (edges.length === 2) {
        const [e1, e2] = edges;
        const v = vPoints.get(vKey)!;
        const other1 = getOtherVertex(e1, v);
        const other2 = getOtherVertex(e2, v);

        // Check collinearity
        const cross = (other1.x - v.x) * (other2.y - v.y) - (other1.y - v.y) * (other2.x - v.x);
        const dot = (other1.x - v.x) * (other2.x - v.x) + (other1.y - v.y) * (other2.y - v.y);

        if (Math.abs(cross) < 1e-7 && dot < 0) {
          const a1 = (e1 as any).assignment;
          const a2 = (e2 as any).assignment;
          
          if (a1 === a2 && e1.foldAngle === e2.foldAngle) {
            const newEdge: Edge = {
              ...e1,
              id: crypto.randomUUID(),
              vertex1: other1,
              vertex2: other2,
            };
            
            activeEdges = activeEdges.filter((e) => e.id !== e1.id && e.id !== e2.id);
            activeEdges.push(newEdge);
            changed = true;
            break; // Restart loop with fresh activeEdges
          }
        }
      }
    }
  }

  // --- BUILD FINAL ADJACENCY ---
  const edgeMap = new Map<string, Edge[]>();
  const pointMap = new Map<string, Point>();

  // Again, build pointMap strictly from activeEdges to prevent ghost vertices
  activeEdges.forEach((edge) => {
    const k1 = pointToKey(edge.vertex1);
    const k2 = pointToKey(edge.vertex2);
    
    if (!edgeMap.has(k1)) { edgeMap.set(k1, []); pointMap.set(k1, edge.vertex1); }
    if (!edgeMap.has(k2)) { edgeMap.set(k2, []); pointMap.set(k2, edge.vertex2); }
    
    edgeMap.get(k1)!.push(edge);
    edgeMap.get(k2)!.push(edge);
  });

  // Sort edges around each vertex by angle
  edgeMap.forEach((edges, vertexKey) => {
    const v = pointMap.get(vertexKey)!;
    edges.sort((a, b) => getEdgeAngle(a, v) - getEdgeAngle(b, v));
  });

  const faces: Face[] = [];
  const usedDirectedEdges = new Set<string>();

  // TRAVERSAL: Find all minimal cycles (faces)
  activeEdges.forEach(edge => {
    [edge.vertex1, edge.vertex2].forEach(v => {
      const nextV = getOtherVertex(edge, v);
      const key = getDirectedEdgeKey(v, nextV);
      
      if (usedDirectedEdges.has(key)) return;

      const currentFace = traceFace(v, edge, edgeMap, usedDirectedEdges);
      
      // Because we use `currentIndex - 1` (Left Turns), internal minimal 
      // faces will be CCW (Area > 0). The infinite face will trace CW (Area < 0).
      const area = getSignedArea(currentFace.border);
      if (area > 0) {
        faces.push(currentFace);
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

    const rotated = [
      A.x + cosTheta * pRel[0] + sinTheta * cross[0] + (1 - cosTheta) * dot * u[0],
      A.y + cosTheta * pRel[1] + sinTheta * cross[1] + (1 - cosTheta) * dot * u[1],
      cosTheta * pRel[2] + sinTheta * cross[2] + (1 - cosTheta) * dot * u[2],
    ];

    return rotated as Point3D;
  });
};

interface FaceEdge {
  face: Face;
  edge: Edge;
}

// Updated to robustly handle duplicate border vertices and merged edges
const shouldFlip = (face: Face, edge: Edge) => {
  const n = face.border.length;
  for (let i = 0; i < n; i++) {
    const p1 = face.border[i];
    const p2 = face.border[(i + 1) % n];
    // If we find the edge in standard sequence, no flip required
    if (pointsEqual(p1, edge.vertex1) && pointsEqual(p2, edge.vertex2)) return false;
    // If we find the edge in reverse sequence, flip is required
    if (pointsEqual(p1, edge.vertex2) && pointsEqual(p2, edge.vertex1)) return true;
  }
  return false; 
};
export const foldFaces = (faces: Face[], cp: CP): FoldedFace[] => {
  if (!faces || faces.length === 0) return [];

  // Derive adjacency strictly from the faces themselves
  const edgeFaces = new Map<string, { edge: Edge; faces: Face[] }>();

  faces.forEach((f: Face) =>
    f.edges.forEach((e: Edge) => {
      if (!edgeFaces.has(e.id)) {
        edgeFaces.set(e.id, { edge: e, faces: [] });
      }
      edgeFaces.get(e.id)!.faces.push(f);
    }),
  );

  const faceAdj = new Map<Face, FaceEdge[]>();
  faces.forEach((f: Face) => faceAdj.set(f, []));
  
  edgeFaces.forEach(({ edge, faces: fs }) => {
    if (fs.length === 2) {
      // ADJACENCY CHECK: Only connect faces across Mountain or Valley folds.
      // Border edges ('B') or internal cuts will effectively split the graph.
      const assignment = (edge as any).assignment;
      if (assignment === "M" || assignment === "V") {
        faceAdj.get(fs[0])!.push({ face: fs[1], edge: edge });
        faceAdj.get(fs[1])!.push({ face: fs[0], edge: edge });
      }
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

  // SPANNING FOREST: Start a DFS for every unvisited face to handle 
  // multiple disconnected components/sub-graphs.
  faces.forEach((f: Face) => {
    if (!facesVisited.has(f)) {
      dfsFaces(f, null); 
    }
  });

  return faces.map((f: Face) => {
    let curFace = f;
    let points = f.border.map((p: Point) => [p.x, p.y, 0] as Point3D);
    let par;
    
    // This will naturally stop at the local root of whichever 
    // disconnected component the curFace belongs to.
    while ((par = faceParent.get(curFace))) {
      const flip = shouldFlip(curFace, par.edge) ? -1 : 1;
      points = rotateFace(points, par.edge, flip);
      curFace = par.face;
    }
    
    return { border: points, id: f.id };
  });
};