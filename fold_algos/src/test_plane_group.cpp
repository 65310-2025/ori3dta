#include <iostream>
#include <vector>

#include <fold.h>
#include <plane_group.h>

using namespace ori3dta;

int main() {
  FOLD test;
  test.file_spec = "1.2";
  test.file_creator = "Crease Pattern Editor";
  test.file_classes = {
    "singleModel"
  };
  test.frame_classes = {
    "creasePattern",
    "noCuts"
  };
  test.vertices_coords = {
    {1,0},
    {0,1},
    {1,2},
    {0,3},
    {1,4},
    {2,3},
    {3,4},
    {4,3},
    {3,2},
    {4,1},
    {3,0},
    {2,1},
    {0,2},
    {2,0},
    {4,2},
    {2,4},
    {0,0},
    {4,0},
    {4,4},
    {0,4}
  };
  test.edges_vertices = {
    {0,1},
    {1,2},
    {2,3},
    {3,4},
    {4,5},
    {5,6},
    {6,7},
    {7,8},
    {8,9},
    {9,10},
    {10,11},
    {11,0},
    {11,2},
    {2,5},
    {5,8},
    {8,11},
    {2,12},
    {11,13},
    {8,14},
    {5,15},
    {16,0},
    {0,13},
    {13,10},
    {10,17},
    {17,9},
    {7,18},
    {9,14},
    {14,7},
    {18,6},
    {4,19},
    {6,15},
    {15,4},
    {19,3},
    {1,16},
    {3,12},
    {12,1}
  };
  test.edges_assignment = {
    edge_assign_t::valley,
    edge_assign_t::valley,
    edge_assign_t::valley,
    edge_assign_t::valley,
    edge_assign_t::valley,
    edge_assign_t::valley,
    edge_assign_t::valley,
    edge_assign_t::valley,
    edge_assign_t::valley,
    edge_assign_t::valley,
    edge_assign_t::valley,
    edge_assign_t::valley,
    edge_assign_t::valley,
    edge_assign_t::valley,
    edge_assign_t::valley,
    edge_assign_t::valley,
    edge_assign_t::mountain,
    edge_assign_t::mountain,
    edge_assign_t::mountain,
    edge_assign_t::mountain,
    edge_assign_t::boundary,
    edge_assign_t::boundary,
    edge_assign_t::boundary,
    edge_assign_t::boundary,
    edge_assign_t::boundary,
    edge_assign_t::boundary,
    edge_assign_t::boundary,
    edge_assign_t::boundary,
    edge_assign_t::boundary,
    edge_assign_t::boundary,
    edge_assign_t::boundary,
    edge_assign_t::boundary,
    edge_assign_t::boundary,
    edge_assign_t::boundary,
    edge_assign_t::boundary,
    edge_assign_t::boundary
  };
  test.edges_foldAngle = {
    90,
    90,
    180,
    90,
    90,
    180,
    90,
    90,
    180,
    90,
    90,
    180,
    90,
    90,
    90,
    90,
    -180,
    -180,
    -180,
    -180,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  };
//  .cpedit:page = {"xMin":0,"yMin":0,"xMax":4,"yMax":4},
  test.vertices_vertices = {
    {13,11,1,16},
    {16,0,2,12},
    {1,11,5,3,12},
    {12,2,4,19},
    {3,5,15,19},
    {2,8,6,15,4},
    {5,7,18,15},
    {8,14,18,6},
    {11,9,14,7,5},
    {10,17,14,8},
    {17,9,11,13},
    {0,13,10,8,2},
    {1,2,3},
    {10,11,0},
    {9,7,8},
    {5,6,4},
    {0,1},
    {9,10},
    {7,6},
    {3,4}
  };
  test.vertices_edges = {
    {21,11,0,20},
    {33,0,1,35},
    {1,12,13,2,16},
    {34,2,3,32},
    {3,4,31,29},
    {13,14,5,19,4},
    {5,6,28,30},
    {7,27,25,6},
    {15,8,18,7,14},
    {9,24,26,8},
    {23,9,10,22},
    {11,17,10,15,12},
    {35,16,34},
    {22,17,21},
    {26,27,18},
    {19,30,31},
    {20,33},
    {24,23},
    {25,28},
    {32,29}
  };
  test.faces_vertices = {
    {0,11,2,1},
    {0,13,11},
    {0,1,16},
    {1,2,12},
    {2,5,4,3},
    {2,11,8,5},
    {2,3,12},
    {3,4,19},
    {4,5,15},
    {5,8,7,6},
    {5,6,15},
    {6,7,18},
    {7,8,14},
    {8,11,10,9},
    {8,9,14},
    {9,10,17},
    {10,11,13}
  };
  test.faces_edges = {
    {11,12,1,0},
    {21,17,11},
    {0,33,20},
    {1,16,35},
    {13,4,3,2},
    {12,15,14,13},
    {2,34,16},
    {3,29,32},
    {4,19,31},
    {14,7,6,5},
    {5,30,19},
    {6,25,28},
    {7,18,27},
    {15,10,9,8},
    {8,26,18},
    {9,23,24},
    {10,17,22}
  };

  std::clog << test.vertices_coords.size() << std::endl;

  PlaneGroup groups(test);

  return 0;
}
