#!/bin/bash

xhost + 

docker run --rm -ti \
    --name gimbal_sim_dev \
    -v $PWD/:/home/$(whoami)/app/ \
    -e DISPLAY=$DISPLAY \
    -v /tmp/.X11-unix:/tmp/.X11-unix \
    -p 3000:1420 \
    gimbal_simulator:dev \
    bash