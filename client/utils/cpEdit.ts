/*
Utility functions for basic crease pattern editing.
How will select -> action (fold, mirror, transform, duplicate) work?
 - fancy selects: by type, by single click, select colinear, select drag box, free select bubble?

 ============
Primitive actions

Create
    edge (with selected MVBAJ type) axiom 1: line passing through two points
     - Create new vertices on each end. See if they overlap with existing vertices, and merge if so.
     - See if edge intersects with any existing edge (aux not included). If so, split the other edge by placing a vertex. Then recursively build the two halves of the new crease until it builds without intersecting anything.
     - See if the edge is coincident with any existing edge. If so, merge and combine fold angles as needed. M + V = delete. M + M = M (clip at 180). etc.
    (optional) vertex
    (optional) auxiliary arc

Delete
    Vertex
     - Delete all edges connected to it
     - Delete the vertex
    Edge
     - Delete the edge. If either of its vertices have no other edges, delete the vertex too

Change
    Vertex
     - Move x y
    edge
     - change assignment (MV: flip sign of fold angle)
     - change fold angle (check if mv changes)

Cleanup. These issues shouldn't arise if other functions are done right, but useful if imported from another software or if a bug slips through
 - Remove unnecessary vertices
 - Look for overlapping vertices/edges and merge them

 =========
Advanced actions: multiple primitive functions with a wrapper
 - Draw grid spaced-parallel lines
 - extend an edge to intersect with selected other edge
    - accept kawasaki a fix
       - propagate kawasaki fixes (draw a fold through many layers)
    - draw reflector and extend until intersect with selected other edge
 - draw grid-snapped or angle restricted line 

7 axioms to create a crease: https://en.wikipedia.org/wiki/Huzita%E2%80%93Hatori_axioms
 - line passing through two points (draw line primitive)
 - fold point onto point
 - fold line onto line: angle bisector but can do parallel (would need two end points)
 - draw a perpendicular line from a vertex to an edge. Or, parallel line through a point (would need two end points)
 Axioms 5-7 are rarely used in crease pattern drawing


Long shot goals: combine other specialty softwares to make a megaprogram
 - hole filling
 - ridge transitions
 - packing (.bps?) -> cp
    - universal molecule 
 - reference finding
 - pythagorean stretch generator
 - parametric design / feature tree
=========

*/

import { connect } from 'mongoose';
import { Fold } from '../../server/types/fold';
import * as float from './float';

const TOLERANCE = 0.001 //tolerance to snap to vertices

export function createEdge(oldfold:Fold,v1:({x:number,y:number}),v2:({x:number,y:number}), foldAngle:number, assignment:string):Fold{
    /*
    Pass in two xy coordinates of the user's drag (line)
    See if there are existing vertices at those points and what the index is. If not, create new vertices and use the new indices   
        recursively check for intersection with existing creases (except aux (behavior can be changed in settings?))
    return fold file with the new crease(s)
    */
    //empty click, no crease made
    if (coindicentVertices(v1,v2,TOLERANCE)) {
        return oldfold;
    }

    const fold = structuredClone(oldfold);

    //Find or create the end vertices
    let v1index = -1
    let v2index = -1
    for (let i = 0; i < fold.vertices_coords.length; i++) {
        if (coindicentVertices(fold.vertices_coords[i],v1,TOLERANCE)) {
            v1index = i
        }
        else if (coindicentVertices(fold.vertices_coords[i],v2,TOLERANCE)) {
            v2index = i
        }
    }
    if (v1index === -1) {
        //vertex does not exist, make new 
        v1index = fold.vertices_coords.length
        fold.vertices_coords.push(v1)
        //see if this new vertex lies on any existing edges
        for(let i=0; i<fold.edges_vertices.length; i++){
            const edge = fold.edges_vertices[i]
            if(vertexOnEdge(v1,{v1:fold.vertices_coords[edge.vertex1],v2:fold.vertices_coords[edge.vertex2]})){
                splitEdge(fold,i,v1index)
            }
        }
    }
    if (v2index === -1) {
        //vertex does not exist, make new
        v2index = fold.vertices_coords.length
        fold.vertices_coords.push(v2)
        //see if this new vertex lies on any existing edges
        for(let i=0; i<fold.edges_vertices.length; i++){
            const edge = fold.edges_vertices[i]
            if(vertexOnEdge(v2,{v1:fold.vertices_coords[edge.vertex1],v2:fold.vertices_coords[edge.vertex2]})){
                splitEdge(fold,i,v2index)
            }
        }
    }

    //Now assume end vertices are all set--look for weird things inside the edge
    const intersections: ({index:number,v:({x:number,y:number})})[] = [] //store coordinates in addition to indices because will need to sort
    const coincidentEdges: number[] = []

    //Does the edge cross any existing vertices? Assume that there are no coincident vertices in the crease pattern
    for (let i = 0; i < fold.vertices_coords.length; i++) {
        if(i===v1index || i===v2index){continue}
        const vertex = fold.vertices_coords[i]
        if (vertexOnEdge(vertex,{v1:v1,v2:v2})){
            intersections.push({index:i,v:vertex})
        }
    }
    //Does the edge intersect or coincide with any existing edges?
    for (let i = 0; i < fold.edges_vertices.length; i++) {
        const edge = fold.edges_vertices[i]

        //If the edge is auxliary, skip. [TODO] make this behavior an optional setting
        if (fold.edges_assignment[i] === "A") {continue}

        //If the edge shares a vertex with the new edge, skip
        if(edge.vertex1 === v1index || edge.vertex2 === v2index || edge.vertex1 === v2index || edge.vertex2 === v1index){continue}

        //Check for intersections
        const edgev1 = fold.vertices_coords[edge.vertex1]
        const edgev2 = fold.vertices_coords[edge.vertex2]
        const intersection = findIntersection({v1:v1,v2:v2},{v1:edgev1,v2:edgev2})
        if (intersection) {
            //This should be a new vertex
            fold.vertices_coords.push(intersection)
            intersections.push({index:fold.vertices_coords.length-1,v:intersection})
            splitEdge(fold,i,fold.vertices_coords.length-1)
        }

        //check for coincident edges. Note that the whole edge lies within the new edge, because when new edges were created the new vertices split anything they intersected
        if(vertexOnEdge(edgev1,{v1:v1,v2:v2}) && vertexOnEdge(edgev2,{v1:v1,v2:v2})){
            coincidentEdges.push(i)
        }
    }

    //Now that all intersections have been found, sort them by distance from v1
    intersections.sort((a,b) => distance(v1,a.v) - distance(v1,b.v))

    //Fill in the crease, watching for the found coincident segments
    //connect v1 to the first intersection
    connectVertices(fold,v1index,intersections[0].index,foldAngle,assignment,coincidentEdges)
    //connect the intersections to each other
    for (let i = 0; i < intersections.length-1; i++) {
        connectVertices(fold,intersections[i].index,intersections[i+1].index,foldAngle,assignment,coincidentEdges)
    }
    //connect the last intersection to v2
    connectVertices(fold,intersections[intersections.length-1].index,v2index,foldAngle,assignment,coincidentEdges)

    return fold
}

// export function deleteEdges(fold:Fold,x1:number,y1:number,x2:number,y2:number):Fold{
//     /*
//     Pass in two xy coordinates of the user's drag (box)
//     figure out which creases intersect the box, with some tolerance
//     return fold file without those creases
//     */
// }

export function editEdge(oldfold:Fold, index:number, assignment:string, foldAngle:number):Fold{
    /*
    Change the assignment and fold angle of a particular crease
    */
    const fold = structuredClone(oldfold);
    fold.edges_assignment[index] = assignment;
    fold.edges_foldAngle[index] = foldAngle;
    return fold;
}

//==========
//Boilerplate helpers

function splitEdge(fold:Fold,edgeIndex:number,vertexIndex:number):Fold{
    /*
    Split an existing edge based on a vertex that lies on the edge.
    Mutates the fold object
    Only use this for existing edges, not for new ones. For new edges go through the recursive process for checking intersections
    */
    //Before: the ith edge was connected to edge.vertex1 and edge.vertex2
    //now, the ith edge is connected to edge.vertex1 and v1index
    //Create new edge connected to v1index and edge.vertex2
    //recall types: v1index and vertex 1 are indices, while v1 is a coordinate
    const oldVertex2Index = fold.edges_vertices[edgeIndex].vertex2
    fold.edges_vertices[edgeIndex].vertex2 = vertexIndex
    fold.edges_vertices.push({vertex1:vertexIndex,vertex2:oldVertex2Index})
    fold.edges_assignment.push(fold.edges_assignment[edgeIndex])
    fold.edges_foldAngle.push(fold.edges_foldAngle[edgeIndex])
    return fold
}

function connectVertices(fold:Fold,v1index:number,v2index:number,foldAngle:number,assignment:string,coincidentEdges:number[]):void{
    for(const coincident of coincidentEdges){
        //check if this segment is the coincident edge
        const v1 = fold.vertices_coords[v1index]
        const v2 = fold.vertices_coords[v2index]
        const coincidentv1 = fold.vertices_coords[fold.edges_vertices[coincident].vertex1]
        const coincidentv2 = fold.vertices_coords[fold.edges_vertices[coincident].vertex2]
        if(vertexOnEdge(v1,{v1:coincidentv1,v2:coincidentv2}) && vertexOnEdge(v2,{v1:coincidentv1,v2:coincidentv2})){
        //Do not create a new edge, merge the fold angles. If the coincident crease was non MV (B, J, U, etc) this will overwrite it
        fold.edges_foldAngle[coincident] += foldAngle
        //[TODO] see if this is the best clipping behavior
        if(fold.edges_foldAngle[coincident]>Math.PI){
            fold.edges_foldAngle[coincident] -= 2*Math.PI
        }
        else if(fold.edges_foldAngle[coincident]<-Math.PI){
            fold.edges_foldAngle[coincident] += 2*Math.PI
        }
        //make sure assignment is correct
        if(fold.edges_foldAngle[coincident]<0){
            fold.edges_assignment[coincident] = "M"
        }
        else if(fold.edges_foldAngle[coincident]>0){
            fold.edges_assignment[coincident] = "V"
        }
        return
    }
    fold.edges_vertices.push({vertex1:v1index,vertex2:v2index})
    fold.edges_assignment.push(assignment)
    fold.edges_foldAngle.push(foldAngle)
    }
}

function findIntersection(l1:({v1:({x:number,y:number}),v2:({x:number,y:number})}),l2:({v1:({x:number,y:number}),v2:({x:number,y:number})})):null|{x:number,y:number}{
    /*
    Find the intersection of two lines. If they don't intersect, return null
    Returns null if they are parallel--this includes coincident
    */
    //https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
    const denominator = (l1.v1.x - l1.v2.x) * (l2.v1.y - l2.v2.y) - (l1.v1.y - l1.v2.y) * (l2.v1.x - l2.v2.x);
    if (float.eq(denominator, 0)) {
        return null; // Lines are parallel
    }
    const t = ((l1.v1.x - l2.v1.x) * (l2.v1.y - l2.v2.y) - (l1.v1.y - l2.v1.y) * (l2.v1.x - l2.v2.x)) / denominator;
    const u = -((l1.v1.x - l1.v2.x) * (l1.v1.y - l2.v1.y) - (l1.v1.y - l1.v2.y) * (l1.v1.x - l2.v1.x)) / denominator;
    if (float.geq(t, 0) && float.leq(t, 1) && float.geq(u, 0) && float.leq(u, 1)) {
        const intersectionX = l1.v1.x + t * (l1.v2.x - l1.v1.x);
        const intersectionY = l1.v1.y + t * (l1.v2.y - l1.v1.y);
        return { x: intersectionX, y: intersectionY };
    }
    return null; // Lines do not intersect within the segments
}

function vertexOnEdge(v:({x:number,y:number}),l:({v1:({x:number,y:number}),v2:({x:number,y:number})})):boolean{
    /*
    Check if a vertex is on an edge
    */
    const tolerance = 0.0001;
    const d1 = Math.sqrt((v.x - l.v1.x) ** 2 + (v.y - l.v1.y) ** 2);
    const d2 = Math.sqrt((v.x - l.v2.x) ** 2 + (v.y - l.v2.y) ** 2);
    const d3 = Math.sqrt((l.v1.x - l.v2.x) ** 2 + (l.v1.y - l.v2.y) ** 2);
    return float.eq(d1 + d2, d3);
}

function coindicentVertices(v1:({x:number,y:number}),v2:({x:number,y:number}),tolerance:number):boolean{
    /*
    Check if two vertices are coincident.
    Includes tolerance because this will be the user clicking on the vertex, so it may be further off than float error tolerance
    */
    // return float.eq(v1.x,v2.x) && float.eq(v1.y,v2.y);
    return float.leq(Math.abs(v1.x - v2.x), tolerance) && float.leq(Math.abs(v1.y - v2.y) , tolerance);
}

function distance(v1:({x:number,y:number}),v2:({x:number,y:number})):number{
    return Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2);
}
// function edgeInBox(edge:({x1:number,x2:number,y1:number,y2:number}),box:({x1:number,y1:number,x2:number,y2:number})):boolean{
//     /*
//     Check if an edge is in a box
//     */

// }