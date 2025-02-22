cmake_minimum_required(VERSION 3.28)

include(FetchContent)

FetchContent_Declare(
  simdjson
  GIT_REPOSITORY https://github.com/simdjson/simdjson.git
  GIT_TAG  tags/v3.12.2
  GIT_SHALLOW TRUE)

FetchContent_MakeAvailable(simdjson)

add_executable(test test.cpp)
target_link_libraries(test simdjson)
