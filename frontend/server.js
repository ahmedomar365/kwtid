const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const fs = require('fs');
const app = express();
const port = 3000;
const path = require('path');
const Jimp = require('jimp');
let fetch;
import('node-fetch').then(({ default: fetchModule }) => {
    fetch = fetchModule;
}).catch(err => console.error('Failed to load node-fetch:', err));
const FormData = require('form-data');
app.use(bodyParser.json());
app.get('/', (req, res) => {
    res.sendFile('/frontend/public/index.html');
});
app.post('/generate-qr', async (req, res) => {
    const { qrData } = req.body;
    const filename = `QRCode-${Date.now()}.png`;
    const qrPath = `/frontend/saved-qr-codes/${filename}`;

    // Generate the QR code as a buffer
    QRCode.toBuffer(qrData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 1,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        },
        width: 128, // Adjust size as needed
    }, async (err, qrBuffer) => {
        if (err) {
            res.status(500).send('Error generating QR Code');
            return;
        }

        try {
            const qrImage = await Jimp.read(qrBuffer);
            const width = qrImage.getWidth();
            const height = qrImage.getHeight();

            // Create a new image (canvas) with the dimensions of the placeholder
            // For example, if the placeholder is 750x750 pixels:
            const canvasWidth = 500;
            const canvasHeight = 500;

            // Calculate the position to place the QR code on the canvas
            const xPosition = (canvasWidth - width) / 2 - 100; // Center horizontally
            const yPosition = (canvasHeight - height) / 2; // Position at 1/4th the height

            const canvas = new Jimp(canvasWidth, canvasHeight, '#FFFFFF');

            // Composite the QR code onto the canvas at the calculated position
            canvas.composite(qrImage, xPosition, yPosition);

            // Save the new image
            canvas.write(qrPath, () => {
                // res.send({ message: 'QR Code generated successfully with background', filename });
                console.log("file saved");
                // uploadFile(qrPath);
                // res.send({ message: 'QR Code generated successfully with background', filename });

            });

            try {
                await uploadFile(qrPath, res);
            } catch (error) {
                console.error('Error:', error);
                res.status(500).send('Error processing file');
            }

        } catch (jimpErr) {
            res.status(500).send('Error creating QR Code with background');
        }
    });
});


const uploadFile = async (filePath, res) => {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    try {
        const response = await fetch('http://localhost:8000/upload', {
            method: 'POST',
            body: form,
        });

        if (response.ok) {
            // Pipe the response directly to the client
            res.setHeader('Content-Type', response.headers.get('Content-Type'));
            response.body.pipe(res);
        } else {
            console.error('Failed to upload file:', response.statusText);
            res.status(500).send('Failed to upload file');
        }
    } catch (error) {
        console.error('Error:', error);
        throw error; // Throw error to be handled by the calling function
    }
};
app.use(express.static(path.join(__dirname, 'public')));


app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
});
