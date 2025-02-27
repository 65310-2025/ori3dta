/*

*/

export type Fold = {
    //=======
    // Metadata
    file_spec?: number; //1.1
    file_creator?: string; //name of the software that created the file
    file_author?: string; //name of the author (username)
    file_title?: string; //name of the file
    file_classes?: Array<string>; //Includes: "singleModel","multiModel","animation","diagrams"
    
    //======= 

    vertices_coords: Array<{
       //Vertex index is implied by the order in the array
       //coordinates on the crease pattern. The default square varies from 0 to 1, although the user may use the file as a "notebook" with multiple crease patterns located around the plane. Note that older softwares define the default square from -200 to 200
        x:number; 
        y:number;
    }>;

    vertices_vertices: Array<Array<number>>; //list of vertices connected to each vertex
    vertices_edges: Array<Array<number>>; //list of edges connected to each vertex
    vertices_faces?: Array<Array<number>>; //list of faces connected to each vertex

    edges_vertices: Array<{
        //Edge index is implied by the order in the array
        vertex1: number;
        vertex2: number;
    }>;

    edges_faces?:Array<{
        left: number | null; //index of the face on the left side of the edge
        right: number | null; //index of the face on the right side of the edge
    }>;

    edges_assignment: Array<string>; //should be same length as edge_vertices
    // "V", "M", "A", "B"
    //valley, mountain, aux, or border (paper edge/cut)
    //Can also include flat (F), cut (C) which is basically two borders, join (J) but these are less common

    //Positive for valley, negative for mountain, 0 for everything else. Import and export as degrees [-180,180] but internally use radians [-pi,pi]. Should match with edges_assignment
    edges_foldAngle: Array<number>;

    edges_length?: Array<number>; //length of the edge. Should match with edges_vertices

    //added when x ray is computed
    faces_vertices?: Array<Array<number>>;
    faces_edges?: Array<Array<number>>;
    faces_faces?: Array<Array<number>>; //list of faces connected to each face

    //added when layer ordering is computed. This structure works for 2d, but may look different for 3d
    faceOrders?: Array<{
        face1: number;
        face2: number;
        order: boolean; //in other softwares, this is 1 and -1
    }>;

    //The above are fields defined by the official FOLD format: https://github.com/edemaine/fold/blob/main/doc/spec.md

    //===========
    //The below are fields that we are introducing. 
    // When exporting, these fields should be prefixed with "ori3dita:" to avoid conflicts with other software
    planeGroups?: Array<{
        normal_vector:Array<{
            x:number;
            y:number;
            z:number;
        }>; //normal vector of the plane
        faces:Array<number>;
    }>; //list of faces that lie on the same planes

    vertices_coords_folded?: Array<{
        x:number;
        y:number;
        z:number;
    }>; //coordinates of the vertices after folding

    symmetry_type?: string | null; //bp, hp, 22.5, 15, or n/a. For displaying grids
    grid_size?: number | null; //size of the grid, or n/a

    //for auxiliary annotation of circle packings. Like Oriedita's .ori file type. Can also store software specific data, like current view parameters
    arcs?: Array<{
        x:number;
        y:number;
        r:number;
        startAngle:number; //radians
        endAngle:number;
    }>;
};


/*
Note: the above is the fully expressed convenient form for internal use. may need a separate type for the compact form, where objects are expressed as arrays, angles are stored in degrees, and redundant fields like vertices_vertices are removed. This compact form will reduce file storage and make it more compatible with other softwares.
*/