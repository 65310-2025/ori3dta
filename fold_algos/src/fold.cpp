#include <vector>

#include <fold.h>
#include <vec_math.h>

using namespace ori3dta;

std::vector<coord_t> FOLD::compute_normal(int face_id) {
  auto face_vertices = faces_vertices[face_id];
  face_vertices.resize(3);
  std::vector<coord_t> res(3);

  int n_vert = face_vertices.size();
  for (int vert_idx = 0; vert_idx < n_vert; vert_idx++) {
    int next_vert_idx = vert_idx ? vert_idx - 1 : n_vert - 1;

    int vert_id = face_vertices[vert_idx];
    int next_vert_id = face_vertices[next_vert_idx];

    const auto& u = vertices_coords[vert_id];
    const auto& v = vertices_coords[next_vert_id];

    res[0] += (u[1] - v[1]) * (u[2] + v[2]);
    res[1] += (u[2] - v[2]) * (u[0] + v[0]);
    res[2] += (u[0] - v[0]) * (u[1] + v[1]);
  }

  normalize_mut(res);

  return res;
}
