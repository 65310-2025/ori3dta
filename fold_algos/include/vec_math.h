#ifndef VEC_MATH_H
#define VEC_MATH_H

#include <cmath>
#include <functional>
#include <numeric>
#include <type_traits>

namespace ori3dta {

template<typename V>
auto vec_len(V& v) {
  using elt_t = std::remove_cvref_t<decltype(*v.begin())>;
  return std::sqrt(std::transform_reduce(
      v.begin(), v.end(), static_cast<elt_t>(0), std::plus(),
      [](const auto& x){ return x * x; }));
}

template<typename V>
void normalize_mut(V& v) {
  auto len = vec_len(v);
  for (auto& x : v) {
    x /= len;
  }
}

template<typename V>
auto dot_prod(V v1, V v2) {
  using elt_t = std::remove_cvref_t<decltype(*v1.begin())>;
  return std::transform_reduce(v1.begin(), v1.end(), v2.begin(),
      static_cast<elt_t>(0));
}

template<typename V>
auto vec_diff_L1(V v1, V v2) {
  using elt_t = std::remove_cvref_t<decltype(*v1.begin())>;
  return std::transform_reduce(v1.begin(), v1.end(), v2.begin(),
      static_cast<elt_t>(0), std::plus(),
      [](const auto& a, const auto& b){ return std::abs(a - b); });
}

template<typename V>
auto vec_diff_L2(V v1, V v2) {
  using elt_t = std::remove_cvref_t<decltype(*v1.begin())>;
  return std::sqrt(std::transform_reduce(v1.begin(), v1.end(), v2.begin(),
      static_cast<elt_t>(0), std::plus(),
      [](const auto& a, const auto& b){ return std::pow(a - b, 2); }));
}

template<typename V>
V cross_prod(V v1, V v2) {
  return {
    v1[1] * v2[2] - v1[2] * v2[1],
    v1[2] * v2[0] - v1[0] * v2[2],
    v1[0] * v2[1] - v1[1] * v2[0],
  };
}

} // namespace ori3dta

#endif // VEC_MATH_H
