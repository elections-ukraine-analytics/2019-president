const https = require('https');
const fs = require('fs');

module.exports = ({ url, filePath }) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    const request = https.get(url, function(response) {
      file.on('end', resolve);
      response.on('error', reject);
      response.pipe(file);
    });
  });
}