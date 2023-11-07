#!/bin/bash

xhost + 

docker run --rm -ti \
    --name gimbal_sim_dev \
    -v $PWD/:/home/$(whoami)/app/ \
    -e DISPLAY=$DISPLAY \
    -v /tmp/.X11-unix:/tmp/.X11-unix \
    gimbal_simulator:dev \
    bash