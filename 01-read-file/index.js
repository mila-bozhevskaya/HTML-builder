const fs = require('fs');
const path = require('path');
const { stdout } = process;

const fileName = 'text.txt';

const rStream = fs.createReadStream(path.join(__dirname, fileName), 'utf-8');

let data = '';

rStream.on('data', chunk => data += chunk);
rStream.on('end', () => stdout.write(data));
rStream.on('error', error => console.log('Error', error.message));
