#include <iostream>
#include <vector>

#include <CGAL/Exact_predicates_exact_constructions_kernel.h>
#include <CGAL/Boolean_set_operations_2.h>

#include <vec_math.h>
#include <layer_solver.h>
#include <plane_group.h>
#include <fold.h>

using namespace ori3dta;

using Kernel = CGAL::Exact_predicates_exact_constructions_kernel;
using Point_2 = Kernel::Point_2;
using Segment_2 = CGAL::Segment_2<Kernel>;
using Polygon_2 = CGAL::Polygon_2<Kernel>;

using Polygon_with_holes_2 = CGAL::Polygon_with_holes_2<Kernel>;
using Pwh_list_2 = std::list<Polygon_with_holes_2>;

LayerSolver::LayerSolver(const FOLD& f) : PlaneGroup(f) {
  compute_constraints();
}

void LayerSolver::compute_constraints() {
  for (int i = 0; i < planegroups_faces.size(); i++) {
    compute_plane_constraints(i);
  }
}

bool does_edge_overlap(const Segment_2& edge, const Polygon_2& poly) {
  return false;
}

void LayerSolver::compute_plane_constraints(planegroup_id_t planegroup_id) {
  const auto& faces = planegroups_faces[planegroup_id];
  const auto& tangent = planegroups_tangent[planegroup_id];
  const auto& bi = planegroups_bi[planegroup_id];

  int n_faces = faces.size();

  std::vector<Polygon_2> faces_proj;
  std::vector<face_id_t> faces_id;

  for (const auto& face : faces) {
    auto& proj = faces_proj.emplace_back();
    faces_id.emplace_back(face);
    for (const auto& vert : faces_vertices[face]) {
      auto& coord = vertices_coords_folded[vert];
      proj.push_back({dot_prod(tangent, coord), dot_prod(bi, coord)});
    }
    if (faces_dir[face]) {
      proj.reverse_orientation();
    }
  }

  // Compute pairs of overlapping faces to generate variables
  for (int i = 0; i < n_faces; i++) {
    for (int j = i + 1; j < n_faces; j++) {
      if (CGAL::do_intersect(faces_proj[i], faces_proj[j])) {
        overlaps_var[std::make_tuple(faces_id[i], faces_id[j])] = solver.newVar();
        std::cout << "intersect: " << faces_id[i] << ", " << faces_id[j] << std::endl;
      }
    }
  }

  // Compute triples of overlapping faces to generate transitivity
  for (int i = 0; i < n_faces; i++) {
    for (int j = i + 1; j < n_faces; j++) {
      auto it_ij = overlaps_var.find(std::make_tuple(faces_id[i], faces_id[j]));
      if (it_ij == overlaps_var.end()) continue;
      Pwh_list_2 pair_intersect;
      CGAL::intersection(faces_proj[i], faces_proj[j],
          std::back_inserter(pair_intersect));
      for (int k = j + 1; k < n_faces; k++) {
        auto it_ik = overlaps_var.find(std::make_tuple(faces_id[i], faces_id[k]));
        if (it_ik == overlaps_var.end()) break;
        auto it_jk = overlaps_var.find(std::make_tuple(faces_id[j], faces_id[k]));
        if (it_jk == overlaps_var.end()) break;
        for (const auto& pwh : pair_intersect) {
          if (CGAL::do_intersect(pwh, faces_proj[k])) {
            auto var_ij = it_ij->second;
            auto var_ik = it_ik->second;
            auto var_jk = it_jk->second;
            solver.addClause(
                Glucose::mkLit(var_ij),
                Glucose::mkLit(var_jk),
                ~Glucose::mkLit(var_ik));
            solver.addClause(
                ~Glucose::mkLit(var_ij),
                ~Glucose::mkLit(var_jk),
                Glucose::mkLit(var_ik));
            std::cout << "triple: " << faces_id[i] << ", " << faces_id[j] << ", " << faces_id[k] << std::endl;
            break;
          }
        }
      }
    }
  }

  // Taco-tortilla
  for (int i = 0; i < n_faces; i++) {
    face_id_t taco_id_1 = faces_id[i];
    const auto& face_poly = faces_proj[i];
    vert_id_t n_vert = face_poly.size();

    vert_id_t prev_vert_idx = 0;
    vert_id_t prev_proj_vert_idx = 0;
    vert_id_t vert_idx;
    vert_id_t proj_vert_idx;

    bool flip_proj = faces_dir[taco_id_1];
    const auto& edges = faces_edges[taco_id_1];

    for (int raw_vert_idx = 1;
        raw_vert_idx <= n_vert;
        prev_vert_idx = vert_idx, prev_proj_vert_idx = proj_vert_idx,
          raw_vert_idx++) {
      if (raw_vert_idx < n_vert) {
        vert_idx = raw_vert_idx;
        proj_vert_idx = flip_proj ? n_vert - vert_idx : vert_idx;
      } else {
        vert_idx = proj_vert_idx = 0;
      }

      std::cout << raw_vert_idx << ":" << prev_vert_idx << "," << prev_proj_vert_idx << "," << vert_idx << "," << proj_vert_idx << std::endl;

      edge_id_t edge_id = edges[prev_vert_idx];

      edge_assign_t assign = edges_assignment[edge_id];

      std::cout << edge_id << "," << static_cast<char>(assign) << std::endl;

      if (assign == edge_assign_t::boundary || assign == edge_assign_t::cut) {
        continue;
      }

      // From taco face_id, cross edge_id to find other face
      // TODO: need to compute edge_faces!!!
      const auto& edge_faces = edges_faces[edge_id];
      auto it = std::find_if(edge_faces.begin(), edge_faces.end(),
          [&](const auto& x){ return x && x != taco_id_1; });
      if (it == edge_faces.end()) {
        std::cerr << "Warning: could not find corresponding face by crossing edge " << edge_id << " from face " << taco_id_1 << std::endl;
        continue;
      }
      face_id_t taco_id_2 = it->value();

      std::cout << taco_id_2 << std::endl;

      // Only look at cases where other face stays in same plane group
      if (faces_planegroup[taco_id_2] != planegroup_id) {
        continue;
      }

      const auto& v1 = face_poly[prev_proj_vert_idx];
      const auto& v2 = face_poly[proj_vert_idx];
      Segment_2 taco_edge{v1, v2};

      std::cerr << "Computing tortillas for " << taco_id_1 << ", " << taco_id_2
        << " ( " << taco_edge << ")" << std::endl;

      // Find tortilla
      for (int j = 0; j < n_faces; j++) {
        face_id_t tortilla_id = faces_id[j];
        const auto& tortilla_poly = faces_proj[j];
        if (!does_edge_overlap(taco_edge, tortilla_poly)) {
          continue;
        }
        switch (edges_assignment[edge_id]) {
          case edge_assign_t::mountain:
          case edge_assign_t::valley:
          case edge_assign_t::flat:
          case edge_assign_t::join:
            ;
        }
      }
    }
  }
}
