#ifndef VEC_MATH_H
#define VEC_MATH_H

#include <functional>
#include <numeric>

namespace ori3dta {

template<typename V>
auto vec_len(V& v) {
  return std::transform_reduce(
      v.begin(), v.end(), 0, std::plus(), [](const auto& x){ return x * x; });
}

template<typename V>
void normalize_mut(V& v) {
  auto len = vec_len(v);
  for (auto& x : v) {
    x /= len;
  }
}

} // namespace ori3dta

#endif // VEC_MATH_H
