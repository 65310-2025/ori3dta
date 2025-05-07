#include <iostream>
#include <vector>

#include <CGAL/Arrangement_2.h>
#include <CGAL/Arr_vertex_index_map.h>
#include <CGAL/Arr_face_index_map.h>
#include <CGAL/Boolean_set_operations_2.h>
#include <CGAL/Exact_predicates_exact_constructions_kernel.h>

#include <dsu.h>
#include <plane_group.h>
#include <plane_arrangement.h>

using namespace ori3dta;

std::ostream& ori3dta::operator<<(std::ostream& os, const PlaneArrangement& arr) {
  face_id_t n_faces = arr.faces_vertices.size();
  for (face_id_t i = 0; i < n_faces; i++) {
    os << "Face " << i << " has subfaces: ";
    for (const auto& subface : arr.faces_subfaces[i]) {
      os << subface << " ";
    }
    os << std::endl;
  }

  face_id_t n_stacks = arr.stacks_vertices.size();
  for (face_id_t i = 0; i < n_stacks; i++) {
    os << "Stack " << i << " has subfaces: ";
    for (const auto& subface : arr.stacks_subfaces[i]) {
      os << subface << " ";
    }
    os << "and coords : ";
    for (const auto& vert : arr.stacks_vertices[i]) {
      os << "(";
      for (const auto& coord : arr.subvertices_coords[vert]) {
        os << coord << ", ";
      }
      os << "), ";
    }
    os << std::endl;
  }

  face_id_t n_subfaces = arr.subfaces_stack.size();
  for (face_id_t i = 0; i < n_subfaces; i++) {
    os << "Subface " << i << ": Face " << arr.subfaces_face[i] << ", Stack " << arr.subfaces_stack[i] << std::endl;
  }


  return os;
}

PlaneArrangement::PlaneArrangement(const FOLD& f) : PlaneGroup(f) {
  faces_subfaces.assign(faces_vertices.size(), {});
  planegroup_id_t n_pg = planegroups_faces.size();
  for (planegroup_id_t i = 0; i < n_pg; i++) {
    compute_arrangement(i);
  }
}

// TODO: cross-planegroup vertices and edges

void PlaneArrangement::compute_arrangement(planegroup_id_t planegroup_id) {
  const auto& faces_proj = pg_faces_proj[planegroup_id];
  const auto& faces = planegroups_faces[planegroup_id];
  const auto& normal = planegroups_normal[planegroup_id];
  const auto& tangent = planegroups_tangent[planegroup_id];
  const auto& bi = planegroups_bi[planegroup_id];
  const auto& dist = planegroups_distance[planegroup_id];

  std::vector<Segment_2> all_edges;
  face_id_t n_faces = faces.size();
  Point_2 origin = {0, 0};
  for (face_id_t i = 0; i < n_faces; i++) {
    const auto& face_proj = faces_proj[i];
    all_edges.insert(all_edges.end(), face_proj.edges_begin(), face_proj.edges_end());
    all_edges.emplace_back(origin, face_proj[0]);
  }

  Arrangement_2 arr;
  CGAL::insert(arr, all_edges.begin(), all_edges.end());
  Arr_vertex_index_map verts_idx(arr);
  Arr_face_index_map stacks_idx(arr);

  std::clog << arr.number_of_vertices() << "," << arr.number_of_faces() << std::endl;

  vert_id_t n_verts = arr.number_of_vertices();
  vert_id_t vert_idx_base = subvertices_coords.size();
  subvertices_coords.resize(vert_idx_base + n_verts);

  for (const auto& vertex : arr.vertex_handles()) {
    const auto& pt = vertex->point();
    const coord_t x = CGAL::to_double(pt.x());
    const coord_t y = CGAL::to_double(pt.y());
    subvertices_coords[vert_idx_base + verts_idx[vertex]] = {
      normal[0] * dist + tangent[0] * x + bi[0] * y,
      normal[1] * dist + tangent[1] * x + bi[1] * y,
      normal[2] * dist + tangent[2] * x + bi[2] * y,
    };
  }

  face_id_t n_stacks = arr.number_of_faces();

  face_id_t stack_id_base = stacks_vertices.size();
  std::clog <<  stack_id_base << "+" << n_stacks << std::endl;
  stacks_vertices.resize(stack_id_base + n_stacks);
  stacks_subfaces.resize(stack_id_base + n_stacks);

  for (const auto& stack : arr.face_handles()) {
    int num_ccbs = stack->number_of_outer_ccbs() + stack->number_of_inner_ccbs();
    if (num_ccbs != 1) {
      std::clog << "More ccbs than expected" << std::endl;
    }
    Polygon_2 stack_poly;
    face_id_t stack_idx = stack_id_base + stacks_idx[stack];
    auto& stack_vertices = stacks_vertices[stack_idx];

    for (auto it = stack->outer_ccbs_begin(); it != stack->outer_ccbs_end(); it++) {
      stack_poly.clear();
      stack_vertices.clear();
      auto ccb_end = *it;
      auto ccb_it = ccb_end;
      do {
        const auto& vert = ccb_it->source();
        stack_poly.push_back(vert->point());
        stack_vertices.push_back(vert_idx_base + verts_idx[vert]);
      } while (++ccb_it != ccb_end);
    }
    /*
    for (auto it = stack->inner_ccbs_begin(); it != stack->inner_ccbs_end(); it++) {
      stack_poly.clear();
      stack_vertices.clear();
      auto ccb_end = *it;
      auto ccb_it = ccb_end;
      do {
        const auto& vert = ccb_it->source();
        stack_poly.push_back(vert->point());
        stack_vertices.push_back(vert_idx_base + verts_idx[vert]);
      } while (--ccb_it != ccb_end);
    }
    */

    for (face_id_t i = 0; i < n_faces; i++) {
      const auto& face_proj = faces_proj[i];
      const auto& face_id = faces[i];

      if (!CGAL::do_intersect(stack_poly, face_proj)) continue;

      stacks_subfaces[stack_idx].push_back(subfaces_stack.size());
      subfaces_stack.push_back(stack_idx);
      faces_subfaces[face_id].push_back(subfaces_face.size());
      subfaces_face.push_back(face_id);
    }
  }
}
