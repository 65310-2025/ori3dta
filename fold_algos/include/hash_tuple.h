#ifndef HASH_TUPLE_H
#define HASH_TUPLE_H

#include <tuple>
#include <utility>

namespace hash_tuple {

struct default_hash_combine {
  std::size_t operator()(std::size_t a, std::size_t b) {
    // Yoinked from boost
    return a ^ (b + 0x9e3779b9 + (a << 6) + (a >> 2));
  }
};

template <typename T, typename HashCombine, std::size_t Idx>
std::size_t hash_impl1(const T& args, HashCombine combine,
    std::index_sequence<Idx>) {
  return std::hash<std::tuple_element_t<Idx, T>>()(std::get<Idx>(args));
}

template <typename T, typename HashCombine, std::size_t... Idx1>
std::size_t hash_impl1(const T& args, HashCombine combine,
    std::index_sequence<Idx1...>);

template <typename T, typename HashCombine, std::size_t... Idx1,
  std::size_t... Idx2>
std::size_t hash_impl2(const T& args, HashCombine combine,
    std::index_sequence<Idx1...> seq1, std::index_sequence<Idx2...> seq2) {
  return combine(
      hash_impl1(std::make_tuple(std::get<Idx1>(args)...), combine, seq1),
      hash_impl1(std::make_tuple(std::get<sizeof...(Idx1) + Idx2>(args)...),
        combine, seq2)
      );
}

template <typename T, typename HashCombine, std::size_t... Idx1>
std::size_t hash_impl1(const T& args, HashCombine combine,
    std::index_sequence<Idx1...>) {
  constexpr size_t mid = sizeof...(Idx1) / 2;
  return hash_impl2(args, combine, std::make_index_sequence<mid>{},
      std::make_index_sequence<sizeof...(Idx1) - mid>{});
}

template<typename T, typename HashCombine = default_hash_combine>
struct hash {
  HashCombine combine;

  std::size_t operator()(const T& t) const {
    return hash_impl1(t, combine,
        std::make_index_sequence<std::tuple_size_v<T>>{});
  }
};

} // namespace hash_tuple


#endif // HASH_TUPLE_H
