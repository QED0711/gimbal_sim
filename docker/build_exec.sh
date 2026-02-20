#!/bin/bash

VERSION=${1:-"release"}

if [[ "$VERSION" == "release" ]]; then
    docker run --rm -ti \
        --name gimbal_sim_exec_builder \
        -v $PWD/:/home/$(whoami)/app/ \
        -e USERNAME=$(whoami) \
        gimbal_simulator:dev \
        npm run tauri build;

    sudo dpkg -i src-tauri/target/release/bundle/deb/gimbal-sim_0.0.0_amd64.deb
elif [[ "$VERSION" == "dev" ]]; then
    docker run --rm -ti \
        --name gimbal_sim_exec_builder \
        -v $PWD/:/home/$(whoami)/app/ \
        -e USERNAME=$(whoami) \
        gimbal_simulator:dev \
        npm run tauri-dev;

    sudo dpkg -i src-tauri/target/debug/bundle/deb/gimbal-sim_0.0.0_amd64.deb
else
    echo "Unknown VERSION: $VERSION"
    echo "Please specify 'release' or 'dev'."
    exit 1
fi