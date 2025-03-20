#ifndef SOLVER_H
#define SOLVER_H

#include <unordered_map>
#include <utility>

struct Solver {
  struct Var {
  };

  Solver();
  void addVar(int f1, int f2);
  void addTransitivity(int f1, int f2, int f3);
};

#endif // SOLVER_H
