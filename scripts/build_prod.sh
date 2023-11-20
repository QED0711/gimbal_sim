#!/bin/bash


docker run --rm -ti --network host \
    --name gimbal_sim_dev \
    -v $PWD/:/home/$(whoami)/app/ \
    -e USERNAME=$(whoami) \
    gimbal_simulator:dev \
    npm run tauri build;

