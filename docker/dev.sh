#!/bin/bash

COMMAND=${1:-bash}

xhost + 

docker run --rm -ti --network host \
    --name gimbal_sim_dev \
    -v $PWD/:/home/$(whoami)/app/ \
    -e DISPLAY=$DISPLAY \
    -v /tmp/.X11-unix:/tmp/.X11-unix \
    -p 3000:1420 \
    -p 8000:8000/udp \
    -e USERNAME=$(whoami) \
    gimbal_simulator:dev \
    $COMMAND