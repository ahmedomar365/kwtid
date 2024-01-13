function onScanSuccess(decodedText, decodedResult) {
    // Send the decoded text to the server
    fetch('/generate-qr', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData: decodedText })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message);
        // Stop scanning QR code
        html5QrcodeScanner.clear();
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function onScanFailure(error) {
    console.warn(`QR code scan error: ${error}`);
}

let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
html5QrcodeScanner.render(onScanSuccess, onScanFailure);
