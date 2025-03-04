#ifndef PLANE_GROUP_H
#define PLANE_GROUP_H

#include <iostream>

#include <fold.h>

namespace ori3dta {

struct FOLD_PlaneGroup : public FOLD {
  std::vector<int> faces_planegroup;
  std::vector<std::vector<int>> planegroups_faces;

  FOLD_PlaneGroup(const FOLD& f);

  void compute_planegroups();

  friend std::ostream& operator<<(std::ostream& os, const FOLD_PlaneGroup& f);
};

} // namespace ori3dta

#endif // PLANE_GROUP_H
