cmake_minimum_required(VERSION 3.28)
project(Ori3dta)
set (CMAKE_CXX_STANDARD 20)

include(FetchContent)

FetchContent_Declare(
  simdjson
  GIT_REPOSITORY https://github.com/simdjson/simdjson.git
  GIT_TAG  tags/v3.12.2
  GIT_SHALLOW TRUE)

#FetchContent_Declare(
#  minisat
#  GIT_REPOSITORY https://github.com/niklasso/minisat.git
#  #  GIT_TAG releases/2.2.0
#  GIT_TAG cd3a2d653fc073585ef05e2ebb72ab015d851279
#  )

FetchContent_Declare(
  glucose
  GIT_REPOSITORY https://github.com/audemard/glucose.git
  GIT_TAG 4.2.1
  GIT_SHALLOW TRUE)

FetchContent_Declare(
  Boost
  URL https://archives.boost.io/release/1.87.0/source/boost_1_87_0_rc1.tar.gz
  URL_HASH SHA256=f55c340aa49763b1925ccf02b2e83f35fdcf634c9d5164a2acb87540173c741d
)

FetchContent_Declare(
  CGAL
  GIT_REPOSITORY https://github.com/CGAL/cgal.git
  GIT_TAG v6.0.1
  GIT_SHALLOW TRUE
  CONFIGURE_COMMAND ""
  BUILD_COMMAND ""
  )

FetchContent_MakeAvailable(simdjson glucose Boost CGAL)

# Ensure Boost paths are set before CGAL
set(Boost_INCLUDE_DIR ${boost_SOURCE_DIR})
set(Boost_LIBRARY_DIR ${boost_BINARY_DIR})

set(BOOST_LIBRARIES
    multiprecision
  )

foreach(lib IN LISTS BOOST_LIBRARIES)
    add_library(boost_${lib} INTERFACE)
    target_include_directories(boost_${lib} INTERFACE ${Boost_SOURCE_DIR})
    target_link_libraries(boost_${lib} INTERFACE Boost::${lib})
endforeach()


set(CGAL_DIR "${FETCHCONTENT_BASE_DIR}/cgal-src")

find_package(CGAL REQUIRED)

add_executable(layer_solver
  src/main.cpp
  src/dsu.cpp
  src/fold.cpp
  src/plane_group.cpp
  src/layer_solver.cpp
  )

target_include_directories(layer_solver
  PUBLIC include
  PRIVATE "${FETCHCONTENT_BASE_DIR}/glucose-src"
)

target_link_libraries(layer_solver
  simdjson
  glucose
  CGAL::CGAL)

target_precompile_headers(layer_solver
  PUBLIC
  <CGAL/Arrangement_2.h>
  <CGAL/Exact_predicates_exact_constructions_kernel.h>
  <CGAL/Boolean_set_operations_2.h>
)

add_executable(plane_arrangement
  src/main_plane_arrangement.cpp
  src/dsu.cpp
  src/fold.cpp
  src/plane_group.cpp
  src/plane_arrangement.cpp
  )

target_include_directories(plane_arrangement
  PUBLIC include
)

target_link_libraries(plane_arrangement
  simdjson
  CGAL::CGAL)

target_precompile_headers(plane_arrangement
  REUSE_FROM
  layer_solver
)
