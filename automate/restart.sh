#!/bin/bash

echo "Script started."

# Check if any ffmpeg processes are running
echo "Checking for running ffmpeg processes..."
pgrep ffmpeg > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "ffmpeg processes found. Attempting to kill..."
    pkill ffmpeg
    if [ $? -ne 0 ]; then
        echo "Error while killing ffmpeg processes."
        exit 1
    fi
    echo "ffmpeg processes killed successfully."
else
    echo "No ffmpeg processes running."
fi

# Start a new ffmpeg process
VIDEO_DEVICE=${VIDEO_DEVICE:-/dev/video1} # Set default video device if not set
echo "Starting ffmpeg on device: $VIDEO_DEVICE"
ffmpeg -loop 1 -r 1 -i /automate/uploads/upload.png -vf scale=768:600 -pix_fmt yuv420p -f v4l2 $VIDEO_DEVICE

ffmpeg_exit_code=$?

if [ $ffmpeg_exit_code -ne 0 ]; then
    echo "Error starting ffmpeg process. Exit code: $ffmpeg_exit_code"
    exit 1
else
    echo "ffmpeg process started successfully."
fi

echo "Script completed."
