#include <iostream>
#include <unordered_map>
#include <vector>

#include <dsu.h>
#include <fold.h>
#include <plane_group.h>
#include <vec_math.h>
#include <CGAL/Exact_predicates_inexact_constructions_kernel.h>
#include <CGAL/Boolean_set_operations_2.h>

using namespace ori3dta;

PlaneGroup::PlaneGroup(const FOLD& f) : FOLD(f) {
  compute_planegroups();
}

void PlaneGroup::compute_planegroups() {
  int n_faces = faces_vertices.size();

  std::vector<std::vector<coord_t>> faces_plane_vals;
  faces_plane_vals.reserve(n_faces);
  for (int face_id = 0; face_id < n_faces; face_id++) {
    const auto& face_vertices = faces_vertices[face_id];
    auto norm = compute_normal(face_id);
    auto some_face_vert = vertices_coords[face_vertices[0]];

    auto proj_len = dot_prod(norm, some_face_vert);

    auto plane_val = norm;
    plane_val.push_back(proj_len);

    faces_plane_vals.push_back(plane_val);
  }

  DSU plane_group_dsu(n_faces);
  for (int face1_id = 0; face1_id < n_faces; face1_id++) {
    for (int face2_id = 0; face2_id < n_faces; face2_id++) {
      const auto& plane_val1 = faces_plane_vals[face1_id];
      auto plane_val2 = faces_plane_vals[face2_id];

      auto vec_diff = vec_diff_L1(plane_val1, plane_val2);
      for (auto& x : plane_val2) x *= -1;
      vec_diff = std::min(vec_diff, vec_diff_L1(plane_val1, plane_val2));

//      std::clog << face1_id << ", " << face2_id << std::endl;
//      for (auto& x : plane_val1) std::clog << x << ' '; std::clog << std::endl;
//      for (auto& x : plane_val2) std::clog << x << ' '; std::clog << std::endl;
//      std::clog << vec_diff << std::endl;

      if (vec_diff < EPS) {
        plane_group_dsu.join(face1_id, face2_id);
      }
    }
  }

  faces_planegroup.assign(n_faces, {});
  planegroups_faces.clear();

  std::unordered_map<int, int> plane_group_ids;
  for (int i = 0; i < n_faces; i++) {
    auto dsu_id = plane_group_dsu.find(i);
    auto it = plane_group_ids.find(dsu_id);
    int id;
    if (it == plane_group_ids.end()) {
      id = plane_group_ids.size();
      plane_group_ids[dsu_id] = id;
      planegroups_faces.emplace_back();
    } else {
      id = it->second;
    }
    faces_planegroup[i] = id;
    planegroups_faces[id].push_back(i);
  }

  faces_dir.assign(n_faces, false);
  planegroups_normal.clear();

  for (int i = 0; i < planegroups_faces.size(); i++) {
    const auto& faces = planegroups_faces[i];
    const auto& ref_plane_val = faces_plane_vals[faces[0]];
    auto& planegroup_normal = planegroups_normal.emplace_back();
    planegroup_normal.assign(ref_plane_val.begin(), std::prev(ref_plane_val.end()));
    for (const auto& face : faces) {
      if (vec_diff_L2(ref_plane_val, faces_plane_vals[face]) < 1) {
        faces_dir[face] = true;
      }
    }
  }

#if 0
  for (int i = 0; i < n_faces; i++) {
    std::clog << "face " << i << ": plane group " << faces_planegroup[i] << ", dir: " << faces_dir[i] << std::endl;
  }
  for (int i = 0; i < planegroups_faces.size(); i++) {
    std::clog << "plane group " << i << ": faces";
    for (auto& x : planegroups_faces[i])
      std::clog << " " << x;
    std::clog << std::endl;
  }
#endif
}
