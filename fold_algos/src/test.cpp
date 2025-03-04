#include <iostream>
#include <vector>

#include <simdjson.h>

#include <fold.h>
#include <plane_group.h>

using namespace simdjson;

/**
 * A custom type that we want to parse.
 */
struct Car {
  std::string make;
  std::string model;
  int64_t year;
  std::vector<double> tire_pressure;
};

#if !SIMDJSON_SUPPORTS_DESERIALIZATION
// This code is not necessary if you have a C++20 compliant system:
template <>
simdjson_inline simdjson_result<std::vector<double>>
simdjson::ondemand::value::get() noexcept {
  ondemand::array array;
  auto error = get_array().get(array);
  if (error) { return error; }
  std::vector<double> vec;
  for (auto v : array) {
    double val;
    error = v.get_double().get(val);
    if (error) { return error; }
    vec.push_back(val);
  }
  return vec;
}
#endif

template <>
simdjson_inline simdjson_result<Car> simdjson::ondemand::value::get() noexcept {
  ondemand::object obj;
  auto error = get_object().get(obj);
  if (error) { return error; }
  Car car;
  if((error = obj["make"].get_string(car.make))) { return error; }
  if((error = obj["model"].get_string(car.model))) { return error; }
  if((error = obj["year"].get_int64().get(car.year))) { return error; }
  if((error = obj["tire_pressure"].get<std::vector<double>>().get(car.tire_pressure))) { return error; }
  return car;
}

int main(void) {
  padded_string json = R"( [ { "make": "Toyota", "model": "Camry",  "year": 2018,
       "tire_pressure": [ 40.1, 39.9 ] },
  { "make": "Kia",    "model": "Soul",   "year": 2012,
       "tire_pressure": [ 30.1, 31.0 ] },
  { "make": "Toyota", "model": "Tercel", "year": 1999,
       "tire_pressure": [ 29.8, 30.0 ] }
])"_padded;
  ondemand::parser parser;
  ondemand::document doc = parser.iterate(json);
  for (auto val : doc) {
    Car c(val); // an exception may be thrown
    std::cout << c.make << std::endl;
  }
  return EXIT_SUCCESS;
}
