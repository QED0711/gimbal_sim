#!/bin/bash

COMMAND=${1:-bash}
source ./docker/.env

xhost + 

docker run --rm --gpus all -ti --network host \
    --name gimbal_sim_dev \
    -v $PWD/:/home/$USERNAME/app/ \
    -v /opt/gimbal.conf:/home/$USERNAME/app/src-tauri/gimbal.conf \
    -e DISPLAY=$DISPLAY \
    -v /tmp/.X11-unix:/tmp/.X11-unix \
    -e USERNAME=$USERNAME \
    -e NVIDIA_VISIBLE_DEVICES=all \
    -e NVIDIA_DRIVER_CAPABILITIES=video,compute,utility \
    --device /dev/input/js0:/dev/input/js0 \
    --device /dev/input/event28:/dev/input/event28 \
    gimbal_simulator:dev \
    $COMMAND