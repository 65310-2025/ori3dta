import { NumberKeyframeTrack } from "three";
import { Fold } from "../types/fold";

export function getFaces(oldfold: Fold): Fold {
    const fold = structuredClone(oldfold);
    fold.faces_vertices = [];
    fold.faces_edges = [];
    fold.faces_faces = [];
    fold.edges_faces = Array.from({ length: fold.edges_vertices.length }, () => ({
        left: null,
        right: null,
    }));

    const N = fold.edges_vertices.length;
    let halfEdges: {
        vertices: [number, number];
        fullEdge: number;
        index: number;
    }[] = structuredClone(fold.edges_vertices).map(([v1, v2], index) => ({
        vertices: [v1, v2],
        fullEdge: index,
        index: index,
    }));

    halfEdges = halfEdges.concat(
        halfEdges.map(({ vertices: [v1, v2], fullEdge }) => ({
            vertices: [v2, v1],
            fullEdge: fullEdge,
            index: fullEdge + N,
        })),
    ); // should be 2N long

    // outgoing half edges from each vertex
    let vertices_outgoingEdges: {
        vertices: [number, number];
        fullEdge: number;
        index: number;
    }[][] = Array.from({ length: fold.vertices_coords.length }, () => []);
    for (const halfEdge of halfEdges) {
        vertices_outgoingEdges[halfEdge.vertices[0]].push(halfEdge);
    }
    // sort vertices_outgoingEdges by angle
    vertices_outgoingEdges = vertices_outgoingEdges.map((edges, vindex) =>
        edges.sort(
            (halfEdgeA, halfEdgeB) =>
                angle(vindex, halfEdgeA.vertices[1], fold) -
                angle(vindex, halfEdgeB.vertices[1], fold),
        ),
    );

    const mutableHalfEdges = structuredClone(halfEdges);
    while (mutableHalfEdges.length > 0) {
        const face_vertices: number[] = [];
        const face_edges: number[] = [];

        let currentHalfEdge = mutableHalfEdges[0];
        mutableHalfEdges.shift();

        face_vertices.push(currentHalfEdge.vertices[0]);
        face_edges.push(currentHalfEdge.fullEdge);

        while (true) {
            const nextVertex: number = currentHalfEdge.vertices[1];
            const outgoingEdges: {
                vertices: [number, number];
                fullEdge: number;
                index: number;
            }[] = vertices_outgoingEdges[nextVertex];

            // index in the list of outgoingEdges
            const currentOutgoingIndex = outgoingEdges.findIndex(
                (halfEdge) => halfEdge.vertices[1] == currentHalfEdge.vertices[0],
            );

            currentHalfEdge =
                outgoingEdges[
                    currentOutgoingIndex < outgoingEdges.length - 1
                        ? currentOutgoingIndex + 1
                        : 0
                ];

            face_vertices.push(currentHalfEdge.vertices[0]);
            face_edges.push(currentHalfEdge.fullEdge);
            const indexToRemove = mutableHalfEdges.findIndex(
                (halfEdge) =>
                    halfEdge.vertices[0] === currentHalfEdge.vertices[0] &&
                    halfEdge.vertices[1] === currentHalfEdge.vertices[1],
            );
            if (indexToRemove !== -1) {
                mutableHalfEdges.splice(indexToRemove, 1);
            }

            if (currentHalfEdge.vertices[1] === face_vertices[0]) {
                break;
            }
        }
        // One of the faces will be tracing the outside of the cp. We can find it and avoid adding it because its orientation will be different.
        if (!isFaceClockwise(face_vertices, fold)) {
            fold.faces_vertices.push(face_vertices);
            fold.faces_edges.push(face_edges);
        }
    }

    // Fill out edges_faces
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
    // Fill out faces_faces
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

export function getFoldedFaces(oldfold: Fold, root_index: number = 0): [number, number, number][][] {
    const fold = getFaces(oldfold);
    // Clip all fold.foldAngles to be between -180 and 180
    fold.edges_foldAngle = fold.edges_foldAngle.map((angle) => {
        while (angle > 180) angle -= 360;
        while (angle < -180) angle += 360;
        return angle;
    });

    // const fold = structuredClone(oldfold);
    // For each face, get a path of edges (represented by their indices) to cross to reach the root face
    const edgeRoutes: [number,Boolean][][] = Array.from(
        { length: fold.faces_vertices.length },
        (_, index) => {
            return [];
        },
    );

    // Using fold.faces_faces, fold.faces_edges, and fold.edges_faces, create a spanning tree that starts at the root face and maps a route to the root face for each face
    // the ith element in edgeRoutes represents the ith face as an array of edges that cross to reach the root face
    const visited = new Array(fold.faces_vertices.length).fill(false);
    const queue = [root_index];
    visited[root_index] = true;

    while (queue.length > 0) {
        const currentFace = queue[0];
        queue.shift();
        const currentRoute = edgeRoutes[currentFace];

        for (const neighbor of fold.faces_faces[currentFace]) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                queue.push(neighbor);

                const edgeBetween = fold.faces_edges[currentFace].find((edge) =>
                    fold.faces_edges[neighbor].includes(edge),
                );

                if (edgeBetween !== undefined) {
                    edgeRoutes[neighbor] = [...currentRoute, [edgeBetween, fold.edges_faces[edgeBetween].left === currentFace ? true : false]];
                }
            }
        }
    }
    console.log(edgeRoutes);
    const foldedFaces:[number, number, number][][] = []
    for(let i = 0; i < edgeRoutes.length; i++) {
        const edgeRoute = edgeRoutes[i];
        const faceVertices = fold.faces_vertices[i];
        const foldedFace = rotateFaceOverRoute(
            faceVertices.map((v) => [fold.vertices_coords[v][0],fold.vertices_coords[v][1],0]),
            edgeRoute.reverse(),
            fold,
            i
        );
        foldedFaces.push(foldedFace);
    }

    // console.log(edgeRoutes);
    // return fold;
    return foldedFaces
}

//=====
// math helper functions

function rotateFace(
    face: [number,number,number][],
    edge: [[number, number], [number, number]],
    angle: number,
): [number,number,number][] {
    const [A2D, B2D] = edge;
    const A = [A2D[0], A2D[1], 0];
    const B = [B2D[0], B2D[1], 0];

    const axis = [
        B[0] - A[0],
        B[1] - A[1],
        B[2] - A[2],
    ];

    const axisLength = Math.hypot(axis[0], axis[1], axis[2]);
    if (axisLength === 0) throw new Error("Edge points must be different.");

    // Normalize the axis
    const u = axis.map(v => v / axisLength);

    const cosTheta = Math.cos(angle);
    const sinTheta = Math.sin(angle);

    const rotatedFace = face.map((P) => {
        // P - A
        const pRel = [
            P[0] - A[0],
            P[1] - A[1],
            P[2] - A[2],
        ];

        // Cross product: u × pRel
        const cross = [
            u[1] * pRel[2] - u[2] * pRel[1],
            u[2] * pRel[0] - u[0] * pRel[2],
            u[0] * pRel[1] - u[1] * pRel[0],
        ];

        // Dot product: u ⋅ pRel
        const dot = u[0] * pRel[0] + u[1] * pRel[1] + u[2] * pRel[2];

        // Rodrigues' rotation formula
        const rotated = [
            A[0] + cosTheta * pRel[0] + sinTheta * cross[0] + (1 - cosTheta) * dot * u[0],
            A[1] + cosTheta * pRel[1] + sinTheta * cross[1] + (1 - cosTheta) * dot * u[1],
            A[2] + cosTheta * pRel[2] + sinTheta * cross[2] + (1 - cosTheta) * dot * u[2],
        ];

        return rotated as [number, number, number];
    });

    return rotatedFace;
}

function rotateFaceOverRoute(
    oldface: [number, number, number][],
    edgeRoute: [number,Boolean][],
    fold: Fold,
    faceindex:number
): [number, number, number][] {
    let face = structuredClone(oldface);
    for (let i = 0; i < edgeRoute.length; i++) {
        const edgeIndex = edgeRoute[i][0];
        const edge = fold.edges_vertices[edgeIndex];
        const angle = fold.edges_foldAngle[edgeIndex] * (edgeRoute[i][1]?1:-1)//(isFaceOnRight(faceindex,edgeIndex,fold)? 1 : -1);
        face = rotateFace(face, [fold.vertices_coords[edge[0]],fold.vertices_coords[edge[1]]], angle);
    }
    return face;
}

function angle(vertex1: number, vertex2: number, fold: Fold): number {
    return Math.atan2(
        fold.vertices_coords[vertex2][1] - fold.vertices_coords[vertex1][1],
        fold.vertices_coords[vertex2][0] - fold.vertices_coords[vertex1][0],
    );
}

function isFaceClockwise(vertices: number[], fold: Fold): boolean {
    let sum = 0;
    for (let i = 0; i < vertices.length; i++) {
        const [x1, y1] = fold.vertices_coords[vertices[i]];
        const [x2, y2] = fold.vertices_coords[vertices[(i + 1) % vertices.length]];
        sum += (x2 - x1) * (y2 + y1);
    }
    return sum < 0;
}

//this is better but not quite right. needs to check that the first face is the edges's left and the second face is the edges's right. will need to keep track of face path
function isFaceOnRight(faceindex:number,edgeindex:number,fold:Fold):boolean {
    const edge = fold.edges_vertices[edgeindex];
    const face = fold.faces_vertices[faceindex];
    
    const v1 = fold.vertices_coords[edge[0]]; // vertex1
    const v2 = fold.vertices_coords[edge[1]]; // vertex2

    // Vector from v1 to v2
    const dx = v2[0] - v1[0];
    const dy = v2[1] - v1[1];

    // Compute angle to rotate so that edge aligns with positive y-axis
    const angle = -Math.atan2(dx, dy); // note: atan2(y, x) but we swap dx/dy to align with y-axis

    // Check all vertices of the face
    for (const vertexIndex of face) {
        const v = fold.vertices_coords[vertexIndex];

        // Translate so v1 is at the origin
        const x = v[0] - v1[0];
        const y = v[1] - v1[1];

        // Rotate point by `angle`
        const rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
        const rotatedY = x * Math.sin(angle) + y * Math.cos(angle);

        // If any vertex is on the right side (rotatedX > 0), return true
        if (rotatedX > 1e-10) {
            return true;
        }
    }

    // All vertices are on the left side or on the line
    return false;
}