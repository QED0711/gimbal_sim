#!/bin/bash

docker run --rm -ti \
    --name gimbal_sim_exec_builder \
    -v $PWD/:/home/$(whoami)/app/ \
    -e USERNAME=$(whoami) \
    gimbal_simulator:dev \
    npm run tauri build;

sudo dpkg -i src-tauri/target/release/bundle/deb/gimbal-sim_0.0.0_amd64.deb