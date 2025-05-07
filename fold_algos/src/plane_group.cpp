#include <iostream>
#include <unordered_map>
#include <vector>

#include <CGAL/Exact_predicates_exact_constructions_kernel.h>
#include <CGAL/Boolean_set_operations_2.h>

#include <dsu.h>
#include <fold.h>
#include <plane_group.h>
#include <vec_math.h>

using namespace ori3dta;

PlaneGroup::PlaneGroup(const FOLD& f) : FOLD(f) {
  compute_planegroups();

  planegroup_id_t n_pg = planegroups_faces.size();
  pg_faces_proj.assign(n_pg, {});
  for (planegroup_id_t i = 0; i < n_pg; i++) {
    compute_faces_proj(i);
  }
}

void PlaneGroup::compute_faces_proj(planegroup_id_t planegroup_id) {
  const auto& faces = planegroups_faces[planegroup_id];
  const auto& tangent = planegroups_tangent[planegroup_id];
  const auto& bi = planegroups_bi[planegroup_id];

  face_id_t n_faces = faces.size();

  auto& faces_proj = pg_faces_proj[planegroup_id];

  for (const auto& face : faces) {
    auto& proj = faces_proj.emplace_back();
    for (const auto& vert : faces_vertices[face]) {
      auto& coord = vertices_coords_folded[vert];
      proj.push_back({dot_prod(tangent, coord), dot_prod(bi, coord)});
    }
    if (faces_dir[face]) {
      proj.reverse_orientation();
    }
  }
}

std::ostream& PlaneGroup::print_debug(std::ostream& os) const {
  for (planegroup_id_t i = 0; i < faces_planegroup.size(); i++) {
    os << "face " << i << ": plane group " << faces_planegroup[i] << ", dir: " << faces_dir[i] << "\n";
  }
  for (planegroup_id_t i = 0; i < planegroups_faces.size(); i++) {
    os << "plane group " << i << ": faces";
    for (auto& x : planegroups_faces[i])
      os << " " << x;
    os << "\n";
  }
  for (planegroup_id_t i = 0; i < planegroups_faces.size(); i++) {
    const auto& planegroup_normal = planegroups_normal[i];
    const auto& planegroup_tangent = planegroups_tangent[i];
    const auto& planegroup_bi = planegroups_bi[i];
    os << "plane group " << i << ": normal:";
    for (auto& x : planegroup_normal) os << " " << x;
    os << ", tangent:";
    for (auto& x : planegroup_tangent) os << " " << x;
    os << ", bi:";
    for (auto& x : planegroup_bi) os << " " << x;
    os << ". Dot products (should be identity):";
    for (auto& x : {planegroup_normal, planegroup_tangent, planegroup_bi}) {
      for (auto& y : {planegroup_normal, planegroup_tangent, planegroup_bi}) {
        os << " " << dot_prod(x, y);
      }
    }
    os << "\n";
  }
  return os;
}

std::ostream& ori3dta::operator<<(std::ostream& os, const PlaneGroup& pg) {
  return pg.print_debug(os);
}

void PlaneGroup::compute_planegroups() {
  face_id_t n_faces = faces_vertices.size();

  // Compute face normals and distances
  std::vector<std::vector<coord_t>> faces_plane_vals;
  faces_plane_vals.reserve(n_faces);
  for (face_id_t face_id = 0; face_id < n_faces; face_id++) {
    const auto& face_vertices = faces_vertices[face_id];
    auto norm = compute_normal(face_id);
    auto some_face_vert = vertices_coords_folded[face_vertices[0]];

    auto proj_len = dot_prod(norm, some_face_vert);

    auto plane_val = norm;
    plane_val.push_back(proj_len);

    faces_plane_vals.push_back(plane_val);
  }

  // Merge pairs of faces that lie in the same plane
  // Since floating point is weird, "lying in the same plane" is not necessarily
  // transitive. Merging essentially computes a transitive closure.
  DSU plane_group_dsu(n_faces);
  for (face_id_t face1_id = 0; face1_id < n_faces; face1_id++) {
    for (face_id_t face2_id = 0; face2_id < n_faces; face2_id++) {
      const auto& plane_val1 = faces_plane_vals[face1_id];
      auto plane_val2 = faces_plane_vals[face2_id];

      auto vec_diff = vec_diff_L1(plane_val1, plane_val2);
      for (auto& x : plane_val2) x *= -1;
      vec_diff = std::min(vec_diff, vec_diff_L1(plane_val1, plane_val2));

      if (vec_diff < EPS) {
        plane_group_dsu.join(face1_id, face2_id);
      }
    }
  }

  // Compute 0-indexed plane group ids from DSU representatives
  faces_planegroup.assign(n_faces, {});
  planegroups_faces.clear();

  std::unordered_map<face_id_t, planegroup_id_t> plane_group_ids;
  for (face_id_t i = 0; i < n_faces; i++) {
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

  // Within each plane group, store normal and distance
  planegroups_normal.clear();
  planegroups_distance.clear();
  for (planegroup_id_t i = 0; i < planegroups_faces.size(); i++) {
    const auto& planegroup_faces = planegroups_faces[i];
    const auto& ref_plane_val = faces_plane_vals[planegroup_faces[0]];

    auto& planegroup_normal = planegroups_normal.emplace_back();
    planegroup_normal.assign(ref_plane_val.begin(), std::prev(ref_plane_val.end()));
    planegroups_distance.emplace_back(ref_plane_val.back());
  }

  // Within each plane group, use normal to compute tangent and bi
  // To compute a tangent vector, use two largest magnitude coordinates
  planegroups_tangent.clear();
  planegroups_bi.clear();
  for (planegroup_id_t i = 0; i < planegroups_faces.size(); i++) {
    auto& planegroup_normal = planegroups_normal[i];
    auto& planegroup_tangent = planegroups_tangent.emplace_back(3);
    auto& planegroup_bi = planegroups_bi.emplace_back();

    std::array<int, 3> normal_idxs = {0, 1, 2};
    std::sort(normal_idxs.begin(), normal_idxs.end(),
      [&](const auto& a, const auto& b){
        const auto f = [&](const auto& i){
          return std::abs(planegroup_normal[i]);
        };
        return f(a) < f(b);
      });
    planegroup_tangent[normal_idxs[1]] = planegroup_normal[normal_idxs[2]];
    planegroup_tangent[normal_idxs[2]] = -planegroup_normal[normal_idxs[1]];
    normalize_mut(planegroup_tangent);

    planegroup_bi = cross_prod(planegroup_normal, planegroup_tangent);
  }

  // Within each plane group, compute face directions
  // The first plane in a plane group is considered to be facing dir=false
  faces_dir.assign(n_faces, false);
  for (planegroup_id_t i = 0; i < planegroups_faces.size(); i++) {
    const auto& planegroup_faces = planegroups_faces[i];
    const auto& ref_plane_val = faces_plane_vals[planegroup_faces[0]];
    for (const auto& face : planegroup_faces) {
      if (vec_diff_L2(ref_plane_val, faces_plane_vals[face]) < 1) {
        faces_dir[face] = true;
      }
    }
  }
}
