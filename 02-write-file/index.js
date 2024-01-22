const fs = require('fs');
const path = require('path');
const { stdin, stdout } = process;

const fPath = path.join(__dirname, './text.txt');

const callbackError = (file, err) => {
  if (!err) return;
  stdout.write(`Something wrong in ${file}`);
  stdout.write(err);
  process.exit(0);
};

const onExit = () => {
  stdout.write('Ok. Goodbye ;)');
  process.exit(0);
};

fs.writeFile(fPath, '', (err) => {
  if (!err) return;
  const cb = callbackError.bind(null, fPath);
  cb(err);
});

const onData = (data, file) => {
  if (data.toString().trim().toLowerCase() === 'exit') onExit();
  const cb = callbackError.bind(null, file);
  fs.appendFile(fPath, data, cb);
};

stdout.write('Please, type your text:\n');
stdin.on('data', (data) => onData(data, fPath));

process.on('SIGINT', onExit);
