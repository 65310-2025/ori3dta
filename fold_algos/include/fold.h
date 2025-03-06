#pragma once
#ifndef FOLD_H
#define FOLD_H

#include <iostream>
#include <optional>
#include <string>
#include <vector>

#include <simdjson.h>

namespace ori3dta {

using coord_t = double;
using angle_t = double;
using dist_t = double;
using vert_id_t = uint32_t;
using edge_id_t = uint32_t;
using face_id_t = uint32_t;

constexpr coord_t EPS = 1e-6;

enum class edge_assign_t : char {
  boundary = 'B',
  mountain = 'M',
  valley = 'V',
  flat = 'F',
  unassigned = 'U',
  cut = 'C',
  join = 'J',
};

struct FOLD {
  std::string file_spec;
  std::string file_creator;
  std::string file_author;
  std::string file_title;
  std::string file_description;
  std::vector<std::string> file_classes;
//  std::vector<> file_frames;

  std::string frame_author;
  std::string frame_title;
  std::string frame_description;
  std::vector<std::string> frame_classes;
  std::vector<std::string> frame_attributes;
  std::string frame_unit;

  std::vector<std::vector<coord_t>> vertices_coords;
  std::vector<std::vector<vert_id_t>> vertices_vertices;
  std::vector<std::vector<edge_id_t>> vertices_edges;
  std::vector<std::vector<std::optional<face_id_t>>> vertices_faces;

  std::vector<std::vector<vert_id_t>> edges_vertices;
  std::vector<std::vector<std::optional<face_id_t>>> edges_faces;
  std::vector<edge_assign_t> edges_assignment;
  std::vector<std::optional<angle_t>> edges_foldAngle;
  std::vector<dist_t> edges_length;

  std::vector<std::vector<vert_id_t>> faces_vertices;
  std::vector<std::vector<edge_id_t>> faces_edges;
  std::vector<std::vector<std::optional<face_id_t>>> faces_faces;

  std::vector<std::tuple<face_id_t, face_id_t, int>> faceOrders;
  std::vector<std::tuple<edge_id_t, edge_id_t, int>> edgeOrders;

  std::vector<coord_t> compute_normal(int face_id);
};

coord_t vec_len(const std::vector<coord_t>& v);

} // namespace ori3dta

#endif // FOLD_H
