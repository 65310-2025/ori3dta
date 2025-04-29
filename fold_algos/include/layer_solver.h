#ifndef LAYER_SOLVER_H
#define LAYER_SOLVER_H

#include <tuple>
#include <vector>

#include <core/SolverTypes.h>
#include <simp/SimpSolver.h>

#include <plane_group.h>
#include <fold.h>
#include <hash_tuple.h>

namespace ori3dta {

using Solver = Glucose::SimpSolver;
using Var = Glucose::Var;
using Lit = Glucose::Lit;

using Kernel = CGAL::Exact_predicates_exact_constructions_kernel;
using Point_2 = Kernel::Point_2;
using Segment_2 = CGAL::Segment_2<Kernel>;
using Polygon_2 = CGAL::Polygon_2<Kernel>;

using Polygon_with_holes_2 = CGAL::Polygon_with_holes_2<Kernel>;
using Pwh_list_2 = std::list<Polygon_with_holes_2>;

class LayerSolver : public PlaneGroup {
  std::vector<std::vector<Polygon_2>> pg_faces_proj;
  std::vector<std::vector<face_id_t>> pg_faces_id;

  std::vector<std::vector<std::pair<edge_id_t, Segment_2>>> pg_in_pg_edges;

public:
  Solver solver;
  std::vector<Var> vars;

  using overlaps_var_key = std::tuple<face_id_t, face_id_t>;
  std::unordered_map<overlaps_var_key, Var, hash_tuple::hash<overlaps_var_key>> overlaps_var;

  LayerSolver(const FOLD& f);

  Lit get_lit(face_id_t f1, face_id_t f2);
  void add_equality(Lit a, Lit b);
  void compute_constraints();
  void compute_plane_constraints(planegroup_id_t planegroup_id);
  void compute_faces_proj(planegroup_id_t planegroup_id);
  void compute_variables(planegroup_id_t planegroup_id);
  void compute_transitivity(planegroup_id_t planegroup_id);
  void compute_taco_tortilla(planegroup_id_t planegroup_id);
};

} // namespace ori3dta

#endif // LAYER_SOLVER_H
