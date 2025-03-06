/*
Inputs a crease pattern as a fold object. Calculates the folded coordinates of the vertices and outputs the fold object with the folded coordinates.

Note: often origami designers will use a file as a "notebook" rather than a single crease pattern. This means that the xray function may need to take a selection of a FOLD file rather than the whole thing. This can be handled later by having the select tool create a temporary FOLD object with only the selected vertices and edges, and this temporary object is what gets passed into this function.


*/
import { Fold } from '../../server/types/fold';

export function getFaces(oldfold:Fold):Fold{
    /*
    Compute the faces based on the vertices and edges. Fill out all the face fields: faces_vertices, faces_edges, faces_faces

    - clone the edges_vertices list, flipping the directions. combine to form a list of directional half-edges.

    - for each vertex, make a list of outgoing half-edges. sort by theta.

    - until the list of half-edges is empty: pick a half-edge v1 -> v2. In v2's list of outgoing edges, find the next one in theta order, v2 -> v3. Continue until you return to the first half-edge. For each edge, add to faces_edges, add the vertices to faces_vertices, and remove the half-edge from the list of half-edges.
    */
    const fold = structuredClone(oldfold);
    fold.faces_vertices = []
    fold.faces_edges = []
    fold.faces_faces = []
    fold.edges_faces = []
    // fold.vertices_faces = [] //Don't think this one is necessary


    const N = fold.edges_vertices.length;
    const halfEdges:{vertex1:number,vertex2:number,fullEdge:number}[] = structuredClone(fold.edges_vertices).map( ({vertex1,vertex2},index) => ({vertex1:vertex1,vertex2:vertex2,fullEdge:index}));
    
    halfEdges.concat( halfEdges.map( ({vertex1,vertex2,fullEdge}) => ({vertex1:vertex2,vertex2:vertex1,fullEdge:fullEdge}) ) ) //should be 2N long

    //if the vertex is not vertex1 of its edge, the twin half-edge should be at edgeIndex + N
    let vertices_outgoingEdges: number[][] = fold.vertices_edges.map( (edges:number[]) => edges.map( (edgeIndex:number,index:number) => fold.edges_vertices[edgeIndex].vertex1 == index? edgeIndex : edgeIndex + N ) )

    vertices_outgoingEdges = vertices_outgoingEdges.map( (edges,index) => edges.sort((vertexA,vertexB) => angle(index,vertexA,fold)-angle(index,vertexB,fold)) )

    while (halfEdges.length > 0){
        const face_vertices:number[] = []
        const face_edges:number[] = []

        const startingHalfEdge = halfEdges[0]
        delete(halfEdges[0])
        face_vertices.push(startingHalfEdge.vertex1)
        face_edges.push(startingHalfEdge.fullEdge)

        //Fill out edges_faces. "left" and "right" are arbitrary, but we say that "left" is the face made from the cloned half-edge and "right" is the face made from the flipped half-edge.
        //the right-left distinction is necessary for calculating the x-ray because it will give the crease a "direction"
        if(startingHalfEdge.vertex1 == fold.edges_vertices[startingHalfEdge.fullEdge].vertex1){
            fold.edges_faces[startingHalfEdge.fullEdge].left = fold.faces_edges.length
        } else {
            fold.edges_faces[startingHalfEdge.fullEdge].right = fold.faces_edges.length
        }

        //[TODO] figure out the index of the next half edge, turning right at vertex2

        //continue adding until you reach startingHalfEdge
        
        //[TODO] this will also pick up a face that traces the outside of the cp. We want to remove this face somehow, making sure it doesn't mess up the indexing of the rest of the faces, and also remove it from edges_faces.

        fold.faces_vertices.push(face_vertices)
        fold.faces_edges.push(face_edges)
    }

    //Fill out faces_faces. initialize as a list of N empty lists, where N is the number of faces.
    //for each edge, push left to right's list, and right to left's list.

    return fold
}

export function xray(cp:Fold,root_index:number = 0){
    /*
    - Create spanning tree, starting from the root_index face. store tree data externally?
    - for each face, vertices will start at cp position, reflect over edges until reach the root face, and then store as folded coords. will be redundant but polynomial time
    */
    return cp.file_creator
}

//===== 
//math helper functions

function angle(vertex1:number,vertex2:number,fold:Fold):number{
    /*
    Takes two vertex indices. Computes the angle of the vector v1 -> v2 with respect to the x axis.
    */
    return Math.atan2(fold.vertices_coords[vertex2].y - fold.vertices_coords[vertex1].y, fold.vertices_coords[vertex2].x - fold.vertices_coords[vertex1].x)
}