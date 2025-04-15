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

void LayerSolver::compute_plane_constraints(int planegroup_id) {
  const auto& faces = planegroups_faces[planegroup_id];
  const auto& tangent = planegroups_tangent[planegroup_id];
  const auto& bi = planegroups_bi[planegroup_id];

  int n_faces = faces.size();

  std::vector<Polygon_2> faces_proj;
  std::vector<int> faces_id;

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
      CGAL::intersection(faces_proj[i], faces_proj[j], std::back_inserter(pair_intersect));
      for (int k = j + 1; k < n_faces; k++) {
        auto it_ik = overlaps_var.find(std::make_tuple(faces_id[i], faces_id[k]));
        if (it_ik == overlaps_var.end()) break;
        auto it_jk = overlaps_var.find(std::make_tuple(faces_id[j], faces_id[k]));
        if (it_jk == overlaps_var.end()) break;
        for (auto& pwh : pair_intersect) {
          if (CGAL::do_intersect(pwh, faces_proj[k])) {
            auto var_ij = it_ij->second;
            auto var_ik = it_ik->second;
            auto var_jk = it_jk->second;
            solver.addClause(Glucose::mkLit(var_ij), Glucose::mkLit(var_jk), ~Glucose::mkLit(var_ik));
            solver.addClause(~Glucose::mkLit(var_ij), ~Glucose::mkLit(var_jk), Glucose::mkLit(var_ik));
            std::cout << "triple: " << faces_id[i] << ", " << faces_id[j] << ", " << faces_id[k] << std::endl;
            break;
          }
        }
      }
    }
  }

  // Taco-taco and taco-tortilla

}
