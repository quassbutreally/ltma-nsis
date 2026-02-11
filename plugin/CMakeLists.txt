cmake_minimum_required(VERSION 4.1)
project(VatsimDepartureList)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(VatsimDepartureList SHARED
        src/plugin.cpp
)

target_include_directories(VatsimDepartureList PRIVATE
        sdk/
)

target_link_libraries(VatsimDepartureList PRIVATE
        ${CMAKE_SOURCE_DIR}/sdk/EuroScopePlugInDll.lib
)

target_compile_definitions(VatsimDepartureList PRIVATE
        WIN32
        _WINDOWS
        _USRDLL
        WIN32_LEAN_AND_MEAN
)

target_compile_options(VatsimDepartureList PRIVATE /arch:IA32)
set_target_properties(VatsimDepartureList PROPERTIES LINK_FLAGS "/MACHINE:X86")
