#pragma once

#include <vector>

class DSU {
  std::vector<int> parent;
  std::vector<int> rank;

public:

  DSU(int n);

  int find(int x);
  void link(int a, int b);
  void join(int a, int b);
};
