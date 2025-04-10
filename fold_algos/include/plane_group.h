#ifndef PLANE_GROUP_H
#define PLANE_GROUP_H

#include <iostream>
#include <vector>

#include <fold.h>

namespace ori3dta {

struct PlaneGroup : public FOLD {
  std::vector<int> faces_planegroup;
  std::vector<bool> faces_dir;
  std::vector<std::vector<int>> planegroups_faces;
  std::vector<coord_t> planegroups_distance;
  std::vector<std::vector<coord_t>> planegroups_normal;
  std::vector<std::vector<coord_t>> planegroups_tangent;
  std::vector<std::vector<coord_t>> planegroups_bi;

  PlaneGroup(const FOLD& f);

  void compute_planegroups();
  std::ostream& print_debug(std::ostream& os) const;

  friend std::ostream& operator<<(std::ostream& os, const PlaneGroup& pg);
};

std::ostream& operator<<(std::ostream& os, const PlaneGroup& pg);

} // namespace ori3dta

#endif // PLANE_GROUP_H
