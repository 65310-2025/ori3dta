#include <iostream>
#include <vector>

#include <simdjson.h>

#include <fold.h>
#include <layer_solver.h>

using namespace simdjson;
using namespace ori3dta;

int main(int argc, char* argv[]) {
  if (argc < 2) {
    std::clog << "Usage: " << argv[0] << " <filename>.fold" << std::endl;
    return 1;
  }

  padded_string json = padded_string::load(argv[1]);
  ondemand::parser parser;

  ondemand::document doc;
  parser.iterate(json).get(doc);

  ori3dta::FOLD fold;
  doc.get(fold);
  fold.compute_edges_faces_from_faces_edges();

  LayerSolver solver(fold);

  for (const auto& [k, v] : solver.overlaps_var) {
    const auto& [f1, f2] = k;
    std::cout << f1 << ", " << f2 << ": " << Glucose::toInt(solver.solver.value(v)) << std::endl;
  }
  return 0;
}
