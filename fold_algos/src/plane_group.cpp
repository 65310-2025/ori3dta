#include <fold.h>
#include <plane_group.h>

using namespace ori3dta;

FOLD_PlaneGroup::FOLD_PlaneGroup(const FOLD& f) : FOLD(f) {
  compute_planegroups();
}

void FOLD_PlaneGroup::compute_planegroups() {
  int n_faces = faces_vertices.size();
  for (int face_id = 0; face_id < n_faces; face_id++) {
    compute_normal(face_id);
  }
}
