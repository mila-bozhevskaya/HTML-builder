const fs = require('fs');
const path = require('path');
const { stdout } = require('process');

const folderPath = path.join(__dirname, 'files');
const copiedFolderPath = path.join(__dirname, 'files-copy');

const clearFolder = async (folder) => {
  const contentDirectory = await fs.promises.readdir(folder, {
    withFileTypes: true,
  });
  const filesList = contentDirectory.map(async (item) => {
    const clearPath = path.join(folder, item.name);
    if (item.isFile()) await fs.promises.unlink(clearPath);
    else {
      await clearFolder(clearPath);
      await fs.promises.rmdir(clearPath);
    }
  });
  return Promise.all(filesList);
};

const createFolder = async (folderPath) => {
  await fs.promises.mkdir(folderPath, { recursive: true });
  await clearFolder(folderPath);
};

const copyFile = async (filePath, copyFilePath) => {
  const outStream = fs.createWriteStream(copyFilePath);
  const inStream = fs.createReadStream(filePath, 'utf-8');
  for await (const chunk of inStream) {
    outStream.write(chunk);
  }
};

const main = async (folderPath = '.', copyFolderPath) => {
  const contentDirectory = await fs.promises.readdir(folderPath, {
    withFileTypes: true,
  });
  contentDirectory.forEach(async (item) => {
    const fromPath = path.join(folderPath, item.name);
    const toPath = path.join(copyFolderPath, item.name);
    if (item.isFile()) {
      copyFile(fromPath, toPath);
    } else {
      await createFolder(toPath);
      await main(fromPath, toPath);
    }
  });
};

const errExit = (error) => {
  stdout.write('Error\n');
  stdout.write(error.message + '\n');
  process.exit(0);
};

createFolder(copiedFolderPath)
  .catch((err) => errExit(err))
  .then(() => main(folderPath, copiedFolderPath))
  .catch((err) => errExit(err))
  .then(() => stdout.write('Hurrah! Files copied\n'));
