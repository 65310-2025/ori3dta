#ifndef PLANE_GROUP_H
#define PLANE_GROUP_H

#include <iostream>
#include <vector>

#include <fold.h>

namespace ori3dta {

using Kernel = CGAL::Exact_predicates_exact_constructions_kernel;
using Point_2 = Kernel::Point_2;
using Polygon_2 = CGAL::Polygon_2<Kernel>;

using planegroup_id_t = uint32_t;

struct PlaneGroup : public FOLD {
  std::vector<int> faces_planegroup;
  std::vector<bool> faces_dir;
  std::vector<std::vector<int>> planegroups_faces;
  std::vector<coord_t> planegroups_distance;
  std::vector<std::vector<coord_t>> planegroups_normal;
  std::vector<std::vector<coord_t>> planegroups_tangent;
  std::vector<std::vector<coord_t>> planegroups_bi;
  std::vector<std::vector<Polygon_2>> pg_faces_proj;

  PlaneGroup(const FOLD& f);

  void compute_planegroups();
  void compute_faces_proj(planegroup_id_t planegroup_id);
  std::ostream& print_debug(std::ostream& os) const;

  friend std::ostream& operator<<(std::ostream& os, const PlaneGroup& pg);
};

std::ostream& operator<<(std::ostream& os, const PlaneGroup& pg);

} // namespace ori3dta

#endif // PLANE_GROUP_H
