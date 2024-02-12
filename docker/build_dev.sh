#!/bin/bash
source ./docker/.env

# username=${1:-$(whoami)}

docker build \
    --build-arg USER_ID=$(id -u) \
    --build-arg GROUP_ID=$(id -g) \
    --build-arg USERNAME=$USERNAME \
    -t gimbal_simulator:dev \
    -f ./docker/Dockerfile.dev . 