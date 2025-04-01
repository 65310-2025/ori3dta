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
  std::vector<std::vector<coord_t>> planegroups_normal;

  PlaneGroup(const FOLD& f);

  void compute_planegroups();

  friend std::ostream& operator<<(std::ostream& os, const PlaneGroup& f);
};

} // namespace ori3dta

#endif // PLANE_GROUP_H
