# Use an Ubuntu base image
FROM ubuntu:latest

# Avoid prompts from apt.
ENV DEBIAN_FRONTEND=noninteractive

# Install necessary packages
RUN apt-get update && apt-get install -y wget unzip openjdk-17-jdk openssh-server ffmpeg

RUN apt-get install -y curl gnupg
RUN apt-get update

RUN apt-get update && \
    apt-get install -y ca-certificates curl gnupg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

ARG NODE_MAJOR=20
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
RUN apt-get update && \
    apt-get install nodejs -y
# Install Appium and Appium Doctor and pm2 globally
RUN npm install -g appium appium-doctor pm2

# Install uiautomator2 driver
RUN appium driver install uiautomator2



# # Configure SSH access
# RUN mkdir /var/run/sshd
# RUN echo 'root:password' | chpasswd
# # Replace 'YOUR_PASSWORD' with the password you want to use for the root user
# # Configure SSH to accept password authentication
# RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
# RUN sed -i 's/UsePAM yes/UsePAM no/' /etc/ssh/sshd_config
# EXPOSE 22

# Set up environment variables
ENV ANDROID_HOME=/root/android-sdk \
    ANDROID_SDK_ROOT=/root/android-sdk \
    PATH=${PATH}:${ANDROID_HOME}/emulator:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/cmdline-tools/latest/bin

# Create android-sdk directory
RUN mkdir $ANDROID_HOME

# Download and unzip the Android command line tools
RUN wget https://dl.google.com/android/repository/commandlinetools-linux-10406996_latest.zip -P $ANDROID_HOME && \
    unzip $ANDROID_HOME/commandlinetools-linux-10406996_latest.zip -d $ANDROID_HOME/cmdline-tools && \
    mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest

# Accept Android SDK licenses
RUN yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses

# Install Android SDK components
RUN $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "build-tools;34.0.0" "emulator" "platform-tools" "platforms;android-34" "system-images;android-34;google_apis;x86_64"

# Create an AVD
RUN echo "no" | $ANDROID_HOME/cmdline-tools/latest/bin/avdmanager create avd -n first -k "system-images;android-34;google_apis;x86_64"

# Clean up
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Copy the entrypoint script to the container
COPY id.apk /id.apk
COPY frontend ./frontend

RUN cd frontend && npm install

COPY automate ./automate


RUN cd automate && npm install



COPY entrypoint.sh /entrypoint.sh

# Give execute permission to the entrypoint script
RUN chmod +x /entrypoint.sh

# COPY restart-ffmpeg.sh /restart-ffmpeg.sh
# #give execute permission to restart-ffmpeg.sh
# RUN chmod +x /restart-ffmpeg.sh
# Set the entrypoint to run the emulator
ENTRYPOINT ["/entrypoint.sh"]
