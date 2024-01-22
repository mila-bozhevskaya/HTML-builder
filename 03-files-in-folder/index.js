const fs = require('fs');
const path = require('path');
const { stdout } = require('process');

const folderPath = path.join(__dirname, 'secret-folder');

const createFileList = (arr) => {
  const fileList = arr.map(
    (item) => `${item.name} - ${item.ext} - ${item.size}\n`,
  );
  return fileList.join('');
};

const makeFileList = async (folderPath = '.') => {
  const contentDirectory = await fs.promises.readdir(folderPath, {
    withFileTypes: true,
  });
  const promises = contentDirectory
    .filter((item) => item.isFile())
    .map(async (item) => {
      const filePath = path.join(folderPath, item.name);
      const { size } = await fs.promises.stat(filePath);
      const exten = path.extname(filePath).substring(1);
      const name = item.name.substring(
        0,
        item.name.length - (exten.length + 1),
      );
      return {
        name,
        ext: exten,
        size: size ? `${size}b (${(size / 1024).toFixed(3)}Kb)` : '0Kb',
      };
    });
  return Promise.all(promises);
};

makeFileList(folderPath, { size: true, lineCount: true })
  .catch((error) => {
    stdout.write('Error\n');
    stdout.write(error.message + '\n');
    process.exit(0);
  })
  .then((data) => stdout.write(createFileList(data)));
