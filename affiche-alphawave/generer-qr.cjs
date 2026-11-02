// Génère le QR code WhatsApp : node generer-qr.cjs [url]
const QRCode = require('qrcode');
const fs = require('fs');
const url = process.argv[2] || 'https://wa.me/971565213488';
QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'Q', margin: 0,
  color: { dark: '#0b1736', light: '#ffffff' } })
  .then(svg => { fs.writeFileSync(__dirname + '/qr-whatsapp.svg', svg); console.log('QR ->', url); });
