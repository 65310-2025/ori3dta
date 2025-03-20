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

FetchContent_MakeAvailable(simdjson glucose)

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

target_include_directories(test
  PUBLIC include
  PRIVATE "${FETCHCONTENT_BASE_DIR}/glucose-src/"
)

target_link_libraries(test
  simdjson
  glucose)

target_include_directories(test_plane_group PUBLIC include)
target_link_libraries(test_plane_group simdjson)
