#include <functional>
#include <iostream>
#include <numeric>
#include <vector>

#include <CGAL/Exact_predicates_exact_constructions_kernel.h>
#include <CGAL/Boolean_set_operations_2.h>

#include <core/SolverTypes.h>
#include <simp/SimpSolver.h>

#include <vec_math.h>
#include <layer_solver.h>
#include <plane_group.h>
#include <fold.h>

using namespace ori3dta;

LayerSolver::LayerSolver(const FOLD& f) : PlaneGroup(f) {
  std::clog << *static_cast<PlaneGroup*>(this) << std::endl;
  compute_constraints();
  solver.verbosity = -1;
  solver.solve();
}

Lit LayerSolver::get_lit(face_id_t f1, face_id_t f2) {
  bool var_flip = f1 > f2;
  if (var_flip) std::swap(f1, f2);
  return Glucose::mkLit(overlaps_var[std::make_tuple(f1, f2)]) ^ var_flip;
}

void LayerSolver::add_equality(Lit a, Lit b) {
  solver.addClause(a, ~b);
  solver.addClause(~a, b);
}


void LayerSolver::compute_constraints() {
  planegroup_id_t n_pg = planegroups_faces.size();
  pg_in_pg_edges.assign(n_pg, {});

  for (planegroup_id_t i = 0; i < n_pg; i++) {
    compute_plane_constraints(i);
  }

  compute_3d_constraints();
}

bool does_edge_overlap_face(const Segment_2& edge, const Polygon_2& poly) {
  if (poly.has_on_positive_side(edge[0]) ||
      poly.has_on_positive_side(edge[1])) {
    return true;
  }

  std::vector<Point_2> edge_intersections;
  for (const auto& poly_edge : poly.edges()) {
    const auto intersection_opt = CGAL::intersection(edge, poly_edge);
    if (!intersection_opt) continue;

    const auto intersection_var = intersection_opt.value();
    if (std::holds_alternative<Segment_2>(intersection_var)) return false;

    edge_intersections.push_back(std::get<Point_2>(intersection_var));
  }
//  Intersections are already sorted in ccw order
//  std::sort(edge_intersections.begin(), edge.intersections().end());
  // TODO: fails for nonconvex polygons
  edge_intersections.erase(
      std::unique(
        edge_intersections.begin(), edge_intersections.end()),
      edge_intersections.end());
  assert(edge_intersections.size() < 3);
  return edge_intersections.size() == 2;
}

bool does_edge_overlap_edge_2d(const Segment_2& e1, const Segment_2& e2) {
  // TODO: inexact ovelap?
  const auto intersection_opt = CGAL::intersection(e1, e2);
  if (!intersection_opt) return false;

  const auto intersection_var = intersection_opt.value();
  return std::holds_alternative<Segment_2>(intersection_var);
}

void LayerSolver::compute_plane_constraints(planegroup_id_t planegroup_id) {
  compute_variables(planegroup_id);
  compute_transitivity(planegroup_id);
  compute_taco_tortilla(planegroup_id);

}



void LayerSolver::compute_variables(planegroup_id_t planegroup_id) {
  const auto& faces_proj = pg_faces_proj[planegroup_id];
  const auto& faces_id = planegroups_faces[planegroup_id];
  face_id_t n_faces = faces_proj.size();

  // Compute pairs of overlapping faces to generate variables
  for (int i = 0; i < n_faces; i++) {
    for (int j = i + 1; j < n_faces; j++) {
      if (CGAL::do_intersect(faces_proj[i], faces_proj[j])) {
        overlaps_var[std::make_tuple(faces_id[i], faces_id[j])] =
          solver.newVar();
        std::cout << "intersect (make var): " << faces_id[i] << ", "
          << faces_id[j] << std::endl;
      }
    }
  }
}

void LayerSolver::compute_transitivity(planegroup_id_t planegroup_id) {
  const auto& faces_proj = pg_faces_proj[planegroup_id];
  const auto& faces_id = planegroups_faces[planegroup_id];
  face_id_t n_faces = faces_proj.size();

  // Compute triples of overlapping faces to generate transitivity
  for (int i = 0; i < n_faces; i++) {
    for (int j = i + 1; j < n_faces; j++) {
      auto it_ij = overlaps_var.find(std::make_tuple(faces_id[i], faces_id[j]));
      if (it_ij == overlaps_var.end()) continue;
      Pwh_list_2 pair_intersect;
      CGAL::intersection(faces_proj[i], faces_proj[j],
          std::back_inserter(pair_intersect));
      for (int k = j + 1; k < n_faces; k++) {
        auto it_ik = overlaps_var.find(
            std::make_tuple(faces_id[i], faces_id[k]));
        if (it_ik == overlaps_var.end()) break;

        auto it_jk = overlaps_var.find(
            std::make_tuple(faces_id[j], faces_id[k]));
        if (it_jk == overlaps_var.end()) break;

        for (const auto& pwh : pair_intersect) {
          if (CGAL::do_intersect(pwh, faces_proj[k])) {
            auto var_ij = it_ij->second;
            auto var_ik = it_ik->second;
            auto var_jk = it_jk->second;
            solver.addClause(
                Glucose::mkLit(var_ij),
                Glucose::mkLit(var_jk),
                ~Glucose::mkLit(var_ik));
            solver.addClause(
                ~Glucose::mkLit(var_ij),
                ~Glucose::mkLit(var_jk),
                Glucose::mkLit(var_ik));
            std::cout << "triple (transitivity): " << faces_id[i] << ", "
              << faces_id[j] << ", " << faces_id[k] << std::endl;
            break;
          }
        }
      }
    }
  }
}

void LayerSolver::compute_taco_tortilla(planegroup_id_t planegroup_id) {
  const auto& faces_proj = pg_faces_proj[planegroup_id];
  const auto& faces_id = planegroups_faces[planegroup_id];
  face_id_t n_faces = faces_proj.size();

  auto& in_pg_edges = pg_in_pg_edges[planegroup_id];

  // Taco-tortilla
  for (int i = 0; i < n_faces; i++) {
    face_id_t taco_id_l = faces_id[i];
    const auto& face_poly = faces_proj[i];
    vert_id_t n_vert = face_poly.size();

    vert_id_t prev_vert_idx = 0;
    vert_id_t prev_proj_vert_idx = 0;
    vert_id_t vert_idx;
    vert_id_t proj_vert_idx;

    bool flip_proj = faces_dir[taco_id_l];
    const auto& edges = faces_edges[taco_id_l];

    for (int raw_vert_idx = 1;
        raw_vert_idx <= n_vert;
        prev_vert_idx = vert_idx, prev_proj_vert_idx = proj_vert_idx,
          raw_vert_idx++) {
      if (raw_vert_idx < n_vert) {
        vert_idx = raw_vert_idx;
        proj_vert_idx = flip_proj ? n_vert - vert_idx : vert_idx;
      } else {
        vert_idx = proj_vert_idx = 0;
      }

      edge_id_t edge_id = edges[prev_vert_idx];

      // Take M/V from edges_assignment
      edge_assign_t assign = edges_assignment[edge_id];

      if (assign == edge_assign_t::boundary || assign == edge_assign_t::cut) {
        continue;
      }

      // From taco face_id, if we're the left face,
      // cross edge_id to find the right face
      const auto& edge_faces = edges_faces[edge_id];
      if (edge_faces[0] != taco_id_l) continue;

      const auto& taco_id_r_opt = edge_faces[1];
      if (!taco_id_r_opt) {
        std::cerr << "Warning: could not find corresponding face by crossing "
          /*<<*/ "edge " << edge_id << " from face " << taco_id_l << std::endl;
        continue;
      }
      face_id_t taco_id_r = taco_id_r_opt.value();

      // Only look at cases where other face stays in same plane group
      if (faces_planegroup[taco_id_r] != planegroup_id) {
        continue;
      }

      const auto& v1 = face_poly[prev_proj_vert_idx];
      const auto& v2 = face_poly[proj_vert_idx];
      Segment_2 taco_edge{v1, v2};

      in_pg_edges.emplace_back(edge_id, taco_edge);

      // For M/V, assign order
      if (assign == edge_assign_t::mountain ||
          assign == edge_assign_t::valley) {
        solver.addClause(
            get_lit(taco_id_l, taco_id_r) ^
            faces_dir[taco_id_l] ^
            (assign == edge_assign_t::mountain));
      }

      std::cerr << "Computing tortillas for " << static_cast<char>(assign)
        << " " << taco_id_l << ", " << taco_id_r << " ( " << taco_edge << ")"
        << std::endl;

      // Find tortilla
      for (int j = 0; j < n_faces; j++) {
        face_id_t tortilla_id = faces_id[j];
        const auto& tortilla_poly = faces_proj[j];
        if (!does_edge_overlap_face(taco_edge, tortilla_poly)) {
          continue;
        }
        std::cerr << "Found tortilla " << tortilla_id << std::endl;
        add_equality(
            get_lit(tortilla_id, taco_id_l),
            get_lit(tortilla_id, taco_id_r));
      }
    }
  }

  // Taco-taco
  edge_id_t num_edges = in_pg_edges.size();
  for (int i = 0; i < num_edges; i++) {
    const auto& [e1_id, e1] = in_pg_edges[i];
    for (int j = i + 1; j < num_edges; j++) {
      const auto& [e2_id, e2] = in_pg_edges[j];
      if (!does_edge_overlap_edge_2d(e1, e2)) {
        continue;
      }

      bool edges_opp_dir = e1.to_vector() * e2.to_vector() < 0;

      const auto& e1_faces = edges_faces[e1_id];
      const auto& e2_faces = edges_faces[e2_id];
      face_id_t e1l = e1_faces[0].value();
      face_id_t e1r = e1_faces[1].value();
      face_id_t e2l = e2_faces[0].value();
      face_id_t e2r = e2_faces[1].value();
      edge_assign_t e1_assign = edges_assignment[e1_id];
      edge_assign_t e2_assign = edges_assignment[e2_id];
      bool e1l_dir = faces_dir[e1l];
      bool e2l_dir = faces_dir[e2l];

      face_id_t e1d = e1l;
      face_id_t e1u = e1r;
      face_id_t e2d = e2l;
      face_id_t e2u = e2r;

      if (e1l_dir ^ (e1_assign == edge_assign_t::mountain))
        std::swap(e1d, e1u);
      if (e2l_dir ^ (e2_assign == edge_assign_t::mountain))
        std::swap(e2d, e2u);

      bool side_flip = e1l_dir ^ e2l_dir ^ edges_opp_dir;

      if ((e1_assign == edge_assign_t::mountain ||
            e1_assign == edge_assign_t::valley) &&
          (e2_assign == edge_assign_t::mountain ||
            e2_assign == edge_assign_t::valley)) {
        if (side_flip) {
          continue;
        }

        // Want to avoid the following stack:
        //   e1u-.
        //   e2u-+.
        //   e1d-'|
        //   e2d--'
        // i.e. ~(e2d<e1d && e1d<e2u && e2u<e1u), and then demorgan's to get
        // the SAT clause
        std::cerr << "Found taco-taco: " << e1d << "<" << e1u
          << ", " << e2d << "<" << e2u << std::endl;
        solver.addClause(~get_lit(e1d, e2d), ~get_lit(e2d, e1u), ~get_lit(e1u, e2u));
        solver.addClause(~get_lit(e2d, e1d), ~get_lit(e1d, e2u), ~get_lit(e2u, e1u));
      } else if ((e1_assign == edge_assign_t::mountain ||
            e1_assign == edge_assign_t::valley) ||
          (e2_assign == edge_assign_t::mountain ||
            e2_assign == edge_assign_t::valley)) {
        // To make life easier, force e1 to be M/V and e2 to be flat/join
        if (e2_assign == edge_assign_t::mountain ||
            e2_assign == edge_assign_t::valley) {
          std::swap(e1d, e2d);
          std::swap(e1u, e2u);
          std::swap(e1l, e2l);
          std::swap(e1r, e2r);
          // Want to avoid the following stack:
          //   e1u-.
          //   e2l-+e2r (need to flip e2l and e2r if side_flip is true)
          //   e1d-'
          face_id_t e2m = side_flip ? e2r : e2l;
          std::cerr << "Found join-edge taco-tortilla: " << e1d << "<" << e1u
            << ", " << e2m << std::endl;
          solver.addClause(~get_lit(e1d, e2m), ~get_lit(e2m, e1u));
        }
      } else {
        if (side_flip) {
          std::swap(e2d, e2u);
        }
        std::cerr << "Found join-edge tortilla-tortilla: " << e1l << "-" << e1r
          << ", " << e2l << "-" << e2r << std::endl;
        add_equality(get_lit(e1l, e2l), get_lit(e1r, e2r));
      }
    }
  }
}

void compute_linegroups() {
/* TODO
  edge_id_t n_edges = edges_vertices.size();

  // Compute edge normals and distances
  std::vector<std::vector<coord_t>> edges_line_vals;
  edges_plane_vals.reserve(n_edges);
  for (edge_id_t edge_id = 0; edge_id < n_edges; edge_id++) {
    const auto& edge_vertices = edges_vertices[edge_id];

    auto proj_len = dot_prod(norm, some_edge_vert);

    auto plane_val = norm;
    plane_val.push_back(proj_len);

    edges_plane_vals.push_back(plane_val);
  }

  // Merge pairs of edges that lie in the same line
  // Since floating point is weird, "lying in the same line" is not necessarily
  // transitive. Merging essentially computes a transitive closure.
  DSU plane_group_dsu(n_edges);
  for (edge_id_t edge1_id = 0; edge1_id < n_edges; edge1_id++) {
    for (edge_id_t edge2_id = 0; edge2_id < n_edges; edge2_id++) {
      const auto& plane_val1 = edges_plane_vals[edge1_id];
      auto plane_val2 = edges_plane_vals[edge2_id];

      auto vec_diff = vec_diff_L1(plane_val1, plane_val2);
      for (auto& x : plane_val2) x *= -1;
      vec_diff = std::min(vec_diff, vec_diff_L1(plane_val1, plane_val2));

      if (vec_diff < EPS) {
        plane_group_dsu.join(edge1_id, edge2_id);
      }
    }
  }

  // Compute 0-indexed plane group ids from DSU representatives
  edges_planegroup.assign(n_edges, {});
  planegroups_edges.clear();

  std::unordered_map<edge_id_t, planegroup_id_t> plane_group_ids;
  for (edge_id_t i = 0; i < n_edges; i++) {
    auto dsu_id = plane_group_dsu.find(i);
    auto it = plane_group_ids.find(dsu_id);
    int id;
    if (it == plane_group_ids.end()) {
      id = plane_group_ids.size();
      plane_group_ids[dsu_id] = id;
      planegroups_edges.emplace_back();
    } else {
      id = it->second;
    }
    edges_planegroup[i] = id;
    planegroups_edges[id].push_back(i);
  }

*/
}

void LayerSolver::compute_3d_constraints() {
  compute_linegroups();
}
