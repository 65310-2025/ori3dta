/*
Inputs a crease pattern as a fold object. Calculates the folded coordinates of the vertices and outputs the fold object with the folded coordinates.

Note: often origami designers will use a file as a "notebook" rather than a single crease pattern. This means that the xray function may need to take a selection of a FOLD file rather than the whole thing. This can be handled later by having the select tool create a temporary FOLD object with only the selected vertices and edges, and this temporary object is what gets passed into this function.


*/
import { Fold } from '../../server/types/fold';

function xray(cp:Fold,root_index:number = 0){
    /*
    - fill out all the face fields: faces_vertices, faces_edges, faces_faces
    - Create spanning tree, starting from the root_index face
    - for each item
    */
    return cp.file_creator
}

