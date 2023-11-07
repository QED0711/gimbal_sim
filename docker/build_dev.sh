#!/bin/bash

docker build \
    --build-arg USER_ID=$(id -u) \
    --build-arg GROUP_ID=$(id -g) \
    --build-arg USERNAME=$(whoami) \
    -t gimbal_simulator:dev \
    -f ./docker/Dockerfile.dev . 