#!/bin/sh

# docker login

docker buildx build --platform linux/arm64 -f Dockerfile --no-cache -t franvipa/wli-edgeless-function-repository-api --push .