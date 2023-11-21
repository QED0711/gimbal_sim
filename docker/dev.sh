#!/bin/bash

COMMAND=${1:-bash}

xhost + 

docker run --rm -ti --network host \
    --name gimbal_sim_dev \
    -v $PWD/:/home/$(whoami)/app/ \
    -e DISPLAY=$DISPLAY \
    -v /tmp/.X11-unix:/tmp/.X11-unix \
    -e USERNAME=$(whoami) \
    gimbal_simulator:dev \
    $COMMAND