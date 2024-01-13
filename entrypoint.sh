#!/bin/bash
# service ssh start
# Set environment variables
export ANDROID_HOME=/root/android-sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin

ffmpeg -loop 1 -r 1 -i /automate/uploads/default.png -vf "scale=768:600" -pix_fmt yuv420p -f v4l2 $VIDEO_DEVICE &
sleep 5

appium &

sleep 5
# Start the emulator



# Get the mapping of webcams and output for debugging
MAP_OUTPUT=$($ANDROID_HOME/emulator/emulator -avd first -webcam-list)
echo "Webcam Mapping Output: $MAP_OUTPUT"

# Find the webcam index for the target device and output for debugging
WEBCAM_INDEX=$(echo "$MAP_OUTPUT" | grep "$VIDEO_DEVICE" | awk '{print $2}' | sed 's/://')
# Remove quotes from WEBCAM_INDEX
WEBCAM_INDEX=$(echo $WEBCAM_INDEX | tr -d "'")
echo "Mapped Webcam Index for $VIDEO_DEVICE: $WEBCAM_INDEX"

# Start the emulator with dynamically mapped webcam
if [ -n "$WEBCAM_INDEX" ]; then
    echo "Starting emulator with $WEBCAM_INDEX for $VIDEO_DEVICE."
    $ANDROID_HOME/emulator/emulator -avd first -no-audio -gpu off -no-skin -camera-back $WEBCAM_INDEX -no-window -scale 0.25 -no-snapshot &
else
    echo "Webcam for $VIDEO_DEVICE not found. Starting emulator without webcam."
    $ANDROID_HOME/emulator/emulator -avd first -no-audio -gpu off -no-skin -no-window -scale 0.25 -no-snapshot &
fi

echo "Emulator started."




# Wait for the emulator to fully start
until adb shell getprop sys.boot_completed | grep -m 1 "1"; do
    echo "Waiting for emulator to fully start..."
    sleep 5
done

sleep 10


# Define your app's package name
PACKAGE='kw.gov.paci.PACIMobileID'

# Check if the APK is already installed
echo "Checking if APK is already installed..."
if adb shell pm list packages | grep "$PACKAGE"; then
    echo "APK is already installed."
else
    # Install the APK
    echo "Installing APK..."
    if adb install id.apk; then # Replace /path/to/your/id.apk with the actual path to your APK
        echo "APK installed successfully."
    else
        echo "Failed to install APK."
        exit 1
    fi
fi




# Define your app's package name and main activity
MAIN_ACTIVITY='kw.gov.paci.PACIMobileID.activities.SplashScreenActivity'

# Start the app
echo "Starting the app..."
adb shell am start -n "$PACKAGE/$MAIN_ACTIVITY"
sleep 5
# Optional: Check if the app is running
# This command lists the running processes and checks if the app's package is among them
if adb shell ps | grep "$PACKAGE"; then
    echo "App is running."
else
    echo "App did not start."
    exit 1
fi


pm2 start /automate/expressID.js

pm2 start /frontend/server.js

pm2 logs