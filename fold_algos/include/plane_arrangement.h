#ifndef PLANE_ARRANGEMENT_H
#define PLANE_ARRANGEMENT_H

#include <tuple>
#include <vector>

#include <CGAL/Arrangement_2.h>
#include <CGAL/Arr_face_index_map.h>
#include <CGAL/Arr_vertex_index_map.h>
#include <CGAL/Exact_predicates_exact_constructions_kernel.h>
#include <CGAL/Boolean_set_operations_2.h>

#include <plane_group.h>
#include <fold.h>
#include <hash_tuple.h>

namespace ori3dta {

using Kernel = CGAL::Exact_predicates_exact_constructions_kernel;
using Point_2 = Kernel::Point_2;
using Segment_2 = CGAL::Segment_2<Kernel>;
using Traits = CGAL::Arr_segment_traits_2<Kernel>;
using Arrangement_2 = CGAL::Arrangement_2<Traits>;
using Arr_vertex_index_map = CGAL::Arr_vertex_index_map<Arrangement_2>;
using Arr_face_index_map = CGAL::Arr_face_index_map<Arrangement_2>;

class PlaneArrangement : public PlaneGroup {
  std::vector<std::vector<coord_t>> subvertices_coords;
  std::vector<std::vector<vert_id_t>> stacks_vertices;
  std::vector<face_id_t> subfaces_stack;
  std::vector<std::vector<face_id_t>> stacks_subfaces;
  std::vector<face_id_t> subfaces_face;
  std::vector<std::vector<face_id_t>> faces_subfaces;

  void compute_arrangement(planegroup_id_t planegroup_id);
public:
  friend std::ostream& operator<<(std::ostream& os, const PlaneArrangement& pg);
  PlaneArrangement(const FOLD& f);
};

std::ostream& operator<<(std::ostream& os, const PlaneArrangement& pg);

} // namespace ori3dta

#endif // PLANE_ARRANGEMENT_H
