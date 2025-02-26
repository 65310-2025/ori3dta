/*
Inputs a crease pattern as a fold object. Calculates the folded coordinates of the vertices and outputs the fold object with the folded coordinates.

Note: often origami designers will use a file as a "notebook" rather than a single crease pattern. This means that the xray function may need to take a selection of a FOLD file rather than the whole thing. This can be handled later by having the select tool create a temporary FOLD object with only the selected vertices and edges, and this temporary object is what gets passed into this function.


*/
import { Fold } from '../../server/types/fold';

export function getFaces(cp:Fold){
    /*
    - fill out all the face fields: faces_vertices, faces_edges, faces_faces
    */
}

export function xray(cp:Fold,root_index:number = 0){
    /*
    - Create spanning tree, starting from the root_index face. store tree data externally?
    - for each face, vertices will start at cp position, reflect over edges until reach the root face, and then store as folded coords. will be redundant but polynomial time
    */
    return cp.file_creator
}

