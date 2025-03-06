cmake_minimum_required(VERSION 3.28)
project(Ori3dta)
set (CMAKE_CXX_STANDARD 20)

include(FetchContent)

FetchContent_Declare(
  simdjson
  GIT_REPOSITORY https://github.com/simdjson/simdjson.git
  GIT_TAG  tags/v3.12.2
  GIT_SHALLOW TRUE)

FetchContent_MakeAvailable(simdjson)

add_executable(test
  src/test.cpp
  src/dsu.cpp
  src/fold.cpp
  src/plane_group.cpp
  )


add_executable(test_plane_group
  src/test_plane_group.cpp
  src/dsu.cpp
  src/fold.cpp
  src/plane_group.cpp
  )

target_include_directories(test PUBLIC include)
target_link_libraries(test simdjson)

target_include_directories(test_plane_group PUBLIC include)
target_link_libraries(test_plane_group simdjson)
