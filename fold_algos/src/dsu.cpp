#include <dsu.h>

#include <numeric>

DSU::DSU(int n) : parent(n), rank(n) {
  std::iota(parent.begin(), parent.end(), 0);
}

int DSU::find(int x) {
  while (x != parent[x]) {
    x = parent[x] = parent[parent[x]];
  }
  return x;
}

void DSU::join(int a, int b) {
  a = find(a);
  b = find(b);
  if (a == b) return;
  link(a, b);
}

void DSU::link(int a, int b) {
  if (rank[a] < rank[b]) std::swap(a, b);
  parent[b] = a;
  if (rank[a] == rank[b]) ++rank[a];
}
