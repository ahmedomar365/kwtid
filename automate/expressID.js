const { remote } = require('webdriverio');
const express = require('express');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const Jimp = require('jimp');
const { spawn } = require('child_process');
const { exec } = require('child_process');
const app = express();
app.use(express.json()); // for parsing application/json
// Middleware for parsing URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));
const port = 8000;
let driverInstance = null;
let ffmpegProcess = null;
const defaultImagePath = path.resolve('/automate/uploads/default.png') // Adjust the path as needed

const qrPath = `./automate/uploads/upload.png`;

async function getDriver() {
    if (driverInstance === null) {
        driverInstance = await remote(wdOpts);
        keepSessionAlive(driverInstance);
    }
    return driverInstance;
}



// Upload Route
app.post('/upload', async (req, res) => {
    const qrData = req.body.qrData; // Extract qrData from request
    console.log(req.body); // Add this line to log the request body
    if (!qrData) {
        return res.status(400).send('Error: No QR Data provided!');
    }
    try {
        // Generate QR code as a buffer
        const qrBuffer = await QRCode.toBuffer(qrData, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 128,
        });

        // Process QR code using Jimp
        const qrImage = await Jimp.read(qrBuffer);
        const width = qrImage.getWidth();
        const height = qrImage.getHeight();

        const canvasWidth = 500; // Set canvas dimensions
        const canvasHeight = 500;
        const xPosition = (canvasWidth - width) / 2 - 100;
        const yPosition = (canvasHeight - height) / 2;
        const canvas = new Jimp(canvasWidth, canvasHeight, '#FFFFFF');

        canvas.composite(qrImage, xPosition, yPosition);
        await canvas.writeAsync(qrPath); // Save the QR code image
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error generating or processing QR Code');
    }

    //add a delay to make sure the file is copied
    screenshotName = await runTest();
    const filePath = path.resolve(screenshotName);

    //implement the file copy to return the camera to the default

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        // Set the proper content type
        res.setHeader('Content-Type', 'image/png');


        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
        // Listen to the finish event to delete the file
        res.on('finish', () => {
            try {
                fs.unlinkSync(filePath);
                console.log('File deleted successfully:', filePath);
            } catch (err) {
                console.error('Error deleting file:', filePath, err);
            }
        });
    } else {

        res.status(404).send('Please upload a correct QR code');
    }
});

function restartFfmpeg() {
    console.log("Restarting ffmpeg...");
    replaceImageStream(defaultImagePath, qrPath);
    //restart ffmpeg
    // First, check if ffmpeg processes are running
    exec("/automate/restart.sh", (error, stdout, stderr) => {
        if (error) {
            // Check if the error is due to no process found or an actual error
            if (error.code === 1) {
                console.log("No ffmpeg processes are running.");
            } else {
                console.error(`Error: ${error.message}`);
                return;
            }
        }
        if (stderr) {
            console.error(`Error: ${stderr}`);
            return;
        }
    });



}

function replaceImageStream(defaultImagePath, uploadImagePath) {
    const readStream = fs.createReadStream(defaultImagePath);
    const writeStream = fs.createWriteStream(uploadImagePath);

    readStream.on('error', (err) => console.error('Error reading file:', err));
    writeStream.on('error', (err) => console.error('Error writing file:', err));

    readStream.pipe(writeStream).on('finish', () => {
        console.log('upload.png has been updated with default image.');
    });
}
async function keepSessionAlive(driver, interval = 30000) { // 5 minutes
    setInterval(async () => {
        try {
            await driver.getCurrentActivity(); // Simple command to keep the session active
            console.log("keep appium alive");
        } catch (error) {
            console.error('Error keeping session alive:', error);
            // Optionally restart the session here if it's not recoverable
        }
    }, interval);
}



app.get('/status', (req, res) => {
    res.send('running');
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

const capabilities = {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'emulator-5554',
    'appium:appPackage': 'kw.gov.paci.PACIMobileID',
    'appium:appActivity': 'kw.gov.paci.PACIMobileID.activities.SplashScreenActivity',
    // 'appium:noReset': true,
    'appium:autoGrantPermissions': 'true'
};


const wdOpts = {
    hostname: process.env.APPIUM_HOST || '127.0.0.1',
    port: parseInt(process.env.APPIUM_PORT, 10) || 4723,
    logLevel: 'info',
    capabilities,
};
async function handleSystemPopup(driver) {


    try {
        const contexts = await driver.getContexts();
        await driver.switchContext(contexts[0]);  // Switching to NATIVE_APP context

        const waitButton = await driver.$('//android.widget.Button[@text="Wait"]');
        if (await waitButton.isDisplayed()) {
            await waitButton.click();
            console.log('Clicked the Wait button on system popup.');
        }

        await driver.switchContext(contexts[1]);  // Switching back to the original context

    } catch (error) {
        console.log('No system popup found or other error occurred.', error);
    }
}
async function homePage(driver) {
    try {

        const closeButton = await driver.$(`android=new UiSelector().resourceId("kw.gov.paci.PACIMobileID:id/2131362173")`);
        if (await closeButton.isDisplayed()) {
            await closeButton.click();
            console.log('Clicked the close button and returned to homepage.');
        }
        const scanButton = await driver.$(`android=new UiSelector().resourceId("kw.gov.paci.PACIMobileID:id/2131363066")`);
        if (await scanButton.isDisplayed()) {
            await scanButton.click();
            console.log('Clicked the close button and returned to homepage.');
        }

    } catch (error) {
        console.log('no scan or close button found.', error);
    }
}
async function runTest() {
    const scanResourceId = "kw.gov.paci.PACIMobileID:id/2131363066";
    const closeResourceId = "kw.gov.paci.PACIMobileID:id/2131362173";
    const defaultImagePath = path.resolve('/automate/uploads/default.png') // Adjust the path as needed
    const uploadImagePath = path.resolve('/automate/uploads/upload.png'); // Adjust the path as needed
    const driver = await getDriver();

    let buttonClose;
    await homePage(driver);
    await handleSystemPopup(driver);
    // await replaceImageStream(defaultImagePath, uploadImagePath);

    try {
        let currentPage = "";
        while (1) {

            try {
                const screenshotName = '/automate/screen/screenshot' + Date.now() + '.png';
                // await driver.saveScreenshot(screenshotName);
                // return screenshotName;
                await driver.waitUntil(async () => {
                    buttonClose = await driver.$(`android=new UiSelector().resourceId("${closeResourceId}")`);
                    return buttonClose && await buttonClose.isDisplayed();
                }, {
                    timeout: 3000,
                    interval: 500,  // checks every 100 ms
                    timeoutMsg: 'Timeout waiting for close button'
                });
                restartFfmpeg();
                await driver.saveScreenshot(screenshotName);
                await buttonClose.click();

                await homePage(driver);
                return screenshotName;

            } catch (error) {
                const screenshotName = '/automate/screen/screenshot' + Date.now() + '.png';

                console.log('go to home page since an error happened');
                await homePage(driver);
                restartFfmpeg();
                await driver.saveScreenshot(screenshotName);
                return screenshotName;

                return "bad";

            }


            // Code here will execute if waitUntil succeeds before timeout

        }
    } catch (error) {
        const screenshotName = '/automate/screen/screenshot' + Date.now() + '.png';

        await driver.saveScreenshot(screenshotName);
        return screenshotName;
        console.error(`An error occurred: ${error}`);
        return "bad";
    } finally {
        // await driver.deleteSession();
    }
}

restartFfmpeg();

runTest().catch(console.error);