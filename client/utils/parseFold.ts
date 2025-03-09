/*
Import .FOLD files from other softwares and parse them as internal ts objects.

Also, export as .FOLD files for other softwares and for cloud storage.

If time allows, also allow imports from .cp, .svg, .ori (in that order of priority)
*/
import { Fold } from '../../server/types/fold';

export function importFold(file: string): Fold {
    /*
    Parse a Fold file and return a Fold object for internal use. Fill out redundant fields like vertices_vertices, and change angles to radians. Make sure edges_foldAngle is filled out--if not, put +-pi based on the MV. Fill out redundant faces_ fields only if face data is present
    */
    const fold = JSON.parse(file) as Fold;

    fold.file_creator="Ori3dita";

    //Convert essential arrays into objects
    fold.vertices_coords = fold.vertices_coords.map(vertex => {
        if (Array.isArray(vertex)) {
            return { x: vertex[0], y: vertex[1] };
        }
        return vertex;
    });

    fold.edges_vertices = fold.edges_vertices.map(edge => {
        if (Array.isArray(edge)) {
            return { vertex1: edge[0], vertex2: edge[1] };
        }
        return edge;
    });

    if (fold.edges_foldAngle){
        //convert from degrees to radians
        fold.edges_foldAngle = fold.edges_foldAngle.map(angle => angle * Math.PI / 180);
    } else {
        //If foldAngle is not present, fill out with +-pi based on the assignment
        fold.edges_foldAngle = fold.edges_assignment.map(assignment => {
            if (assignment === "V") {
                return Math.PI;
            } else if (assignment === "M") {
                return -Math.PI;
            } else {
                return 0;
            }
        });
    }

    //Initialize fold.vertices_vertices as an array of n empty arrays, where n is the number of vertices. Just assume it's not there already
    fold.vertices_vertices = [];
    fold.vertices_edges = [];
    for (let i = 0; i < fold.vertices_coords.length; i++) {
        fold.vertices_vertices.push([]);
        fold.vertices_edges.push([]);
    }
    for (const edge of fold.edges_vertices) {
        fold.vertices_vertices[edge.vertex1].push(edge.vertex2);
        fold.vertices_vertices[edge.vertex2].push(edge.vertex1);

        const edgeIndex = fold.edges_vertices.indexOf(edge);
        fold.vertices_edges[edge.vertex1].push(edgeIndex);
        fold.vertices_edges[edge.vertex2].push(edgeIndex);
    }

    //Ignore faces_fields. Will be filled out when the user calls xray, layer ordering, or other functions that require faces

    //Remove fields that are specific to other softwares
    for (const key in fold) {
        if (Object.prototype.hasOwnProperty.call(fold, key) && key.includes(':') && !key.startsWith('Ori3dita:')) {
            delete fold[key];
        }
    }
    
    return fold;
}

export function exportFold(fold: Fold): string {
    /*
    Export in compact form. Turn objects back into lists, radians into degrees, and remove redundant fields like vertices_vertices
    */
    
    //make a clone of the fold object
    const output = JSON.parse(JSON.stringify(fold));
    //remove redundant fields: vertices_vertices, vertices_edges, vertices_faces, edges_faces, faces_edges, faces_faces
    delete output.vertices_vertices;
    delete output.vertices_edges;
    delete output.vertices_faces;
    delete output.edges_faces;
    delete output.faces_edges;
    delete output.faces_faces;

    //convert edges_foldAngle back to degrees
    output.edges_foldAngle = output.edges_foldAngle.map((angle: number) => angle * 180 / Math.PI);
    //Replace objects like {x:1,y:2} with arrays like [1,2]
    output.vertices_coords = output.vertices_coords.map((vertex: { x: number, y: number }) => [vertex.x, vertex.y]);
    output.edges_vertices = output.edges_vertices.map((edge: { vertex1: number, vertex2: number }) => [edge.vertex1, edge.vertex2]);

    //[TODO] add "Ori3dita:" to custom fields
    return JSON.stringify(output);
}