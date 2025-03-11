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

namespace simdjson {
// suppose we want to filter out all Toyotas
template <typename simdjson_value>
auto tag_invoke(deserialize_tag, simdjson_value &val, ori3dta::FOLD& fold) {
  ondemand::object obj;
  auto error = val.get_object().get(obj);
  if (error) { return error; }

  auto file_spec_obj = obj["file_spec"];
  error = file_spec_obj.get_string(fold.file_spec);
  if (error == INCORRECT_TYPE) {
    double file_spec_num;
    error = file_spec_obj.get(file_spec_num);
    fold.file_spec = std::to_string(file_spec_num);
  }


  obj["file_creator"].get_string(fold.file_creator);
  obj["file_author"].get_string(fold.file_author);
  obj["file_title"].get_string(fold.file_title);
  obj["file_description"].get_string(fold.file_description);

  ondemand::array file_classes_obj;
  if (!obj["file_classes"].get_array().get(file_classes_obj)) {
    for (auto file_class_obj : file_classes_obj) {
      std::string file_class;
      file_class_obj.get_string(file_class);
      fold.file_classes.emplace_back(std::move(file_class));
    }
  }

  obj["frame_author"].get_string(fold.frame_author);
  obj["frame_title"].get_string(fold.frame_title);
  obj["frame_description"].get_string(fold.frame_description);

  ondemand::array frame_classes_obj;
  if (!obj["frame_classes"].get_array().get(frame_classes_obj)) {
    for (auto frame_class_obj : frame_classes_obj) {
      std::string frame_class;
      frame_class_obj.get_string(frame_class);
      fold.frame_classes.emplace_back(std::move(frame_class));
    }
  }

  ondemand::array frame_attributes_obj;
  if (!obj["frame_attributes"].get_array().get(frame_attributes_obj)) {
    for (auto frame_attribute_obj : frame_attributes_obj) {
      std::string frame_attribute;
      frame_attribute_obj.get_string(frame_attribute);
      fold.frame_attributes.emplace_back(std::move(frame_attribute));
    }
  }


  obj["frame_unit"].get_string(fold.frame_unit);

  obj["vertices_coords"].get<>(fold.vertices_coords);
  obj["vertices_vertices"].get<>(fold.vertices_vertices);
  obj["vertices_edges"].get<>(fold.vertices_edges);
  obj["vertices_faces"].get<>(fold.vertices_faces);

  obj["edges_vertices"].get<>(fold.edges_vertices);
  obj["edges_faces"].get<>(fold.edges_faces);
//  obj["edges_assignment"].get<>(fold.edges_assignment);
  obj["edges_foldAngle"].get<>(fold.edges_foldAngle);
  obj["edges_length"].get<>(fold.edges_length);

  obj["faces_vertices"].get<>(fold.faces_vertices);
  obj["faces_edges"].get<>(fold.faces_edges);
  obj["faces_faces"].get<>(fold.faces_faces);



  return simdjson::SUCCESS;
}

}

#endif // FOLD_H
