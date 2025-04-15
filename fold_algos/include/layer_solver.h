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


struct LayerSolver : public PlaneGroup {
  Solver solver;
  std::vector<Var> vars;

  using overlaps_var_key = std::tuple<int, int>;
  std::unordered_map<overlaps_var_key, Var, hash_tuple::hash<overlaps_var_key>> overlaps_var;

  LayerSolver(const FOLD& f);

  void compute_constraints();
  void compute_plane_constraints(int planegroup_id);
};

} // namespace ori3dta

#endif // LAYER_SOLVER_H
