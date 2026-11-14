#!/bin/bash
# Usage: ./shot.sh <name> "<query>" [width] [height]
OUT="$(dirname "$0")/shots"
mkdir -p "$OUT"
W=${3:-1280}
H=${4:-800}
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --hide-scrollbars --use-angle=swiftshader --enable-unsafe-swiftshader \
  --window-size=$W,$H --virtual-time-budget=15000 --enable-logging=stderr --v=0 \
  --screenshot="$OUT/$1.png" "file://$(cd "$(dirname "$0")/.." && pwd)/House-Walkthrough.html?shot=1&$2" 2>&1 \
  | grep -iE "CONSOLE|error" | grep -viE "cv_display|gpu_init|viz|ssl|dbus|angle_platform" | head -8
