#!/usr/bin/env bash
set -e

glxinfo | grep 'OpenGL vendor string' > cur_vendor