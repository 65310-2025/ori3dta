import { Fold } from "../types/fold";
import * as float from "./float";

// const TOLERANCE = 0.001; //tolerance to snap to vertices

export function createEdge(
    oldfold: Fold,
    v1: [number, number], //position of click start
    v2: [number, number], //position of click end
    foldAngle: number,
    assignment: string,
    TOLERANCE:number, //because tolerance is based on pixels 
): Fold {
    if (coincidentVertices(v1, v2, TOLERANCE)) {
        return oldfold;
    }

    const fold = structuredClone(oldfold);

    let v1index = -1;
    let v2index = -1;

    for (let i = 0; i < fold.vertices_coords.length; i++) {
        const distanceToV1 = distance(fold.vertices_coords[i], v1);
        if (distanceToV1 <= TOLERANCE && (v1index === -1 || distanceToV1 < distance(fold.vertices_coords[v1index], v1))) {
            v1index = i;
        }
        const distanceToV2 = distance(fold.vertices_coords[i], v2);
        if (distanceToV2 <= TOLERANCE && (v2index === -1 || distanceToV2 < distance(fold.vertices_coords[v2index], v2))) {
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

    for (let i = 0; i < fold.vertices_coords.length; i++) {
        if (i === v1index || i === v2index) {
            continue;
        }
        const vertex = fold.vertices_coords[i];
        if (vertexOnEdge(vertex, { v1: v1, v2: v2 })) {
            intersections.push({ index: i, v: vertex });
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
        }
    }

    intersections.sort((a, b) => distance(v1, a.v) - distance(v1, b.v));
    console.log(intersections);
    console.log(coincidentEdges);

    if (intersections.length === 0) {
        connectVertices(
            fold,
            v1index,
            v2index,
            foldAngle,
            assignment,
            coincidentEdges,
        );
        return fold;
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

    return fold;
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
        const coincidentv1 = fold.vertices_coords[fold.edges_vertices[coincident][0]];
        const coincidentv2 = fold.vertices_coords[fold.edges_vertices[coincident][1]];
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

    const det = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]);

    if (det === 0) return null;

    const t =
        ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / det;
    const u =
        ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / det;

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
