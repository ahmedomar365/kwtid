# Kwtid

## Caution

This project is an independent initiative and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with the Public Authority for Civil Information (PACI) of Kuwait. It utilizes features already available in the Kuwait Mobile ID application but is not an official tool or associated with the official app's development.

## About the Project

Kwtid is designed to simplify and automate the process of verifying a Mobile ID by leveraging cloud technology. This project ports the Mobile ID verification process to the cloud, facilitating easy and efficient verification.

### Key Features

- **Mobile ID Verification**: Automates the process of Mobile ID verification using cloud-based technology.
- **Appium Integration**: Uses Appium for automating interactions with the Kuwait Mobile ID application on an Android emulator.
- **Docker Power**: Utilizes Docker for efficient, scalable, and isolated emulation environments.
- **API Exposure**: Provides an API endpoint to accept qrData, which is read from the Kuwait Mobile ID application.
- **Automated Response**: Automatically processes the QR data and returns a screenshot of the identity as the response.

## Getting Started

The project setup requires an Ubuntu server with a minimum of 6 GB of RAM, 1 CPU, and at least 20 GB of storage. The following steps will guide you through a fresh server installation to ensure proper functioning of the application:

### Installation Steps

1. **System Update and Upgrade**
   ```
   sudo apt update
   sudo apt upgrade
   ```

2. **Check for Virtualization Support**
   ```
   sudo apt install cpu-checker
   kvm-ok
   ```

3. **Install v4l2loopback for Virtualized Camera Support**
   ```
   sudo apt-get install v4l2loopback-dkms
   sudo modprobe v4l2loopback
   ```

4. **Install Docker**
   Follow the official Docker installation [guide](https://docs.docker.com/engine/install/ubuntu/).

5. **Add Docker's GPG Key and Repository**
   ```
   sudo apt-get update
   sudo apt-get install ca-certificates curl gnupg
   sudo install -m 0755 -d /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   sudo chmod a+r /etc/apt/keyrings/docker.gpg
   ```

6. **Install Docker Packages**
   ```
   sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   sudo docker run hello-world
   ```

7. **Clone the Repository**
   ```
   git clone https://github.com/ahmedomar365/kwtid.git
   cd kwtid
   ```

8. **Download and Prepare the APK**
   Download `id.apk` from [APKPure](https://apkpure.net/kuwait-mobile-id-%D9%87%D9%88%D9%8A%D8%AA%D9%8A/kw.gov.paci.PACIMobileID/download) and place it in the `kwtid` directory.

9. **Build the Docker Image**
   ```
   docker build -t kwtid .
   ```

### NGINX Configuration (Optional)

For domain handling, install and start NGINX, then configure the SSL and domain settings. Ensure to create an SSL folder and set up the SSL certificate and key.

### Running the Application

1. **Run the Docker Container**
   ```
   docker run -d -e VIDEO_DEVICE=/dev/video0 -p 3000:3000 -p 8000:8000 --device=/dev/video0 --privileged --name kwtid kwtid
   ```

2. **Monitor the Emulator Status**
   ```
   docker logs -f kwtid
   ```

3. **Access the Application**
   Use a tool like Postman to interact with the API endpoint for status checks and to send QR data as JSON.

### Post-Installation

After building, confirm the emulator status and take a screenshot using `adb`. Transfer the screenshot from Docker to your host machine using `docker cp`.



### Testing

Verify the application is running correctly by accessing the status endpoint and sending QR data.
### Post-Installation Steps

After the Docker container is up and running, you can check the status of the emulator using the following command:
```
docker logs -f kwtid
```
You should see output indicating that the emulator is starting up, such as "Waiting for emulator to fully start."

Once you see a message similar to:
```
INFO | Boot completed in 50948 ms
INFO | Increasing screen off timeout, logcat buffer size to 2M.
```
This indicates that the emulator is running. Wait for the APK installation and backend services to start.

To verify that everything is functioning inside the emulator:
1. Enter the Docker container:
   ```
   docker exec -it kwtid bash
   ```
2. Navigate to the ADB tools directory and take a screenshot:
   ```
   cd ~/android-sdk/platform-tools/
   ./adb shell screencap -p /sdcard/screenshot.png
   ./adb pull /sdcard/screenshot.png .
   ```
3. Exit the Docker container:
   ```
   exit
   ```
4. Copy the screenshot from the Docker container to your host machine:
   ```
   docker cp kwtid:/root/android-sdk/platform-tools/screenshot.png .
   ```

You should now be able to view the screenshot on your host machine. An example screenshot can be seen here:
![Emulator Screenshot](https://github.com/ahmedomar365/kwtid/assets/70892817/5b401637-43ee-418c-9c91-ca8d35b15cb6)

### Testing the Application

To ensure that the application is working correctly:
- Open Postman and check the application status by accessing `https://[hostname]/status`. For example, `https://kwtid.com/status` should return 'running'.
- Send the QR data as JSON to the API endpoint and expect a response with the identity screenshot.

An example of the response you should receive:
![API Response](https://github.com/ahmedomar365/kwtid/assets/70892817/6ce42f5f-48dc-405e-8f03-1371bc2b6e4b)


## Roadmap

- Implement status checks to prevent QR scanning conflicts.
- Add OCR for identity information extraction.
- Extend support for other identity documents.
- Enhance server capacity for multiple emulators and load balancing.
- Implement access controls for API usage.


Buy me a coffee 🙏
https://www.buymeacoffee.com/ahmedomarar365


## License

Licensed under the MIT License.
