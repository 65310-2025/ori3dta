#ifndef VEC_MATH_H
#define VEC_MATH_H

#include <cmath>
#include <functional>
#include <numeric>

namespace ori3dta {

template<typename V>
auto vec_len(V& v) {
  return std::sqrt(std::transform_reduce(
      v.begin(), v.end(), 0, std::plus(), [](const auto& x){ return x * x; }));
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
  return std::inner_product(v1.begin(), v1.end(), v2.begin(), 0);
}

template<typename V>
auto vec_diff_L1(V v1, V v2) {
  return std::inner_product(v1.begin(), v1.end(), v2.begin(), 0, std::plus(),
      [](const auto& a, const auto& b){ return std::abs(a - b); });
}

} // namespace ori3dta

#endif // VEC_MATH_H
