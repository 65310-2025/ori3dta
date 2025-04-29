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

    const auto& u = vertices_coords_folded[vert_id];
    const auto& v = vertices_coords_folded[next_vert_id];

    res[0] += (u[1] - v[1]) * (u[2] + v[2]);
    res[1] += (u[2] - v[2]) * (u[0] + v[0]);
    res[2] += (u[0] - v[0]) * (u[1] + v[1]);
  }

  normalize_mut(res);

  return res;
}

void FOLD::compute_edges_faces_from_faces_edges() {
  edge_id_t num_edges = edges_vertices.size();
  edges_faces.assign(num_edges, {{},{}}/*std::vector<std::optional<face_id_t>>(2)*/);

  face_id_t num_faces = faces_edges.size();
  for (face_id_t face_id = 0; face_id < num_faces; face_id++) {
    const auto& verts = faces_vertices[face_id];
    const auto& edges = faces_edges[face_id];

    vert_id_t num_vertices = verts.size();
    vert_id_t prev_idx = num_vertices - 1;
    for (vert_id_t idx = 0; idx < num_vertices; prev_idx = idx++) {
      const edge_id_t edge_id = edges[prev_idx];
      const auto& edge = edges_vertices[edge_id];
      const vert_id_t e0 = edge[0];
      const vert_id_t e1 = edge[1];
      const vert_id_t v0 = verts[prev_idx];
      const vert_id_t v1 = verts[idx];

      auto& edge_faces = edges_faces[edge_id];

      const auto set_edge_face =
        [&](std::optional<face_id_t>& edge_face, face_id_t face_id){
          if (edge_face) {
            // TODO: how handle this error?
            std::clog << "Error: multiple faces on a side of edge" << std::endl;
            return;
          }
          edge_face = face_id;
        };

      if (e0 == v0 && e1 == v1) {
        set_edge_face(edge_faces[0], face_id);
      } else if (e0 == v1 && e1 == v0) {
        set_edge_face(edge_faces[1], face_id);
      } else {
        // TODO: how handle this error?
        std::clog << "Error: inconsistency between faces_vertices[" << face_id
          << "][" << prev_idx << "," << idx << "] = " << v0 << "," << v1
          << " and edges_vertices[faces_edges[" << face_id << "][" << prev_idx
          << "]] = " << e0 << "," << e1
          << std::endl;
      }
    }
  }
}
