const fs = require('fs');
const path = require('path');
const { stdout } = require('process');

const htmlFileSrc = path.join(__dirname, 'template.html');
const htmlComponentSrc = path.join(__dirname, 'components');
const styleFileSrc = path.join(__dirname, 'styles');
const assetsFolderSrc = path.join(__dirname, 'assets');
const outFolder = path.join(__dirname, 'project-dist');
const outAssetsFolder = path.join(outFolder, 'assets');
const outHtmlFile = path.join(outFolder, 'index.html');

const errExit = (error) => {
  stdout.write('Error\n');
  stdout.write(error.message + '\n');
  process.exit(0);
};

const clearFolder = async (folder) => {
  const contentDirectory = await fs.promises.readdir(folder, {
    withFileTypes: true,
  });
  const list = contentDirectory.map(async (item) => {
    const clearPath = path.join(folder, item.name);
    if (item.isFile()) return await fs.promises.unlink(clearPath);
    else {
      await clearFolder(clearPath);
      return await fs.promises.rmdir(clearPath);
    }
  });
  return Promise.all(list);
};

const createFolder = async (folderPath, clear = true) => {
  await fs.promises.mkdir(folderPath, { recursive: true });
  if (clear) await clearFolder(folderPath);
};

const getFileList = async (folder, ext) => {
  const contentDirectory = await fs.promises.readdir(folder, {
    withFileTypes: true,
  });
  const list = [];
  contentDirectory.forEach(async (item) => {
    const pathSrc = path.join(folder, item.name);
    if (!item.isFile()) {
      const listFromFolder = await getFileList(pathSrc, ext);
      list.push(listFromFolder);
    } else {
      const extention = path.extname(pathSrc).substring(1);
      if (extention === ext) {
        const name = item.name.substring(
          0,
          item.name.length - (ext.length + 1),
        );
        list.push({ name, path: pathSrc });
      }
    }
  });
  return list;
};

const createHtmlFile = async (srcHtmlFile, outHtmlFile) => {
  const htmlComponentList = await getFileList(htmlComponentSrc, 'html');
  await fs.promises.writeFile(outHtmlFile, '');
  const rStream = fs.createReadStream(srcHtmlFile, 'utf8');
  const wStream = fs.createWriteStream(outHtmlFile);
  for await (const chunk of rStream) {
    let chunkToString = chunk.toString();
    for (let l = 0; l < htmlComponentList.length; l++) {
      let buf = [];
      if (chunkToString.includes(`{{${htmlComponentList[l].name}}}`)) {
        const rStream2 = fs.createReadStream(htmlComponentList[l].path, 'utf8');
        for await (const chunk of rStream2) {
          buf.push(chunk.toString());
        }
        chunkToString = await chunkToString.replace(
          `{{${htmlComponentList[l].name}}}`,
          buf.join('\n'),
        );
      }
    }
    wStream.write(chunkToString);
  }
};

const createStyleFile = async (srcStyleFolder, outFolder, styleBundle) => {
  const styleBundlePath = path.join(outFolder, styleBundle);
  await fs.promises.writeFile(styleBundlePath, '').catch((err) => errExit(err));
  const fileList = await getFileList(srcStyleFolder, 'css').catch((err) =>
    errExit(err),
  );
  fileList.reverse();
  const buf = [];
  for await (const file of fileList) {
    const wStream = fs.createWriteStream(styleBundlePath);
    const rStream = fs.createReadStream(file.path, 'utf8');
    rStream.on('data', (chunk) => buf.push(chunk));
    rStream.on('error', (error) => errExit(error));
    rStream.on('end', () => {
      for (let i = 0; i < buf.length; i++) {
        wStream.write(buf[i]);
      }
    });
  }
};

const copyFile = async (filePath, copyFilePath) => {
  await fs.promises.copyFile(filePath, copyFilePath);
};

const copyAssetsFolder = async (folderPath = '.', copyFolderPath) => {
  await fs.promises.mkdir(copyFolderPath, { recursive: true });
  const contentDirectory = await fs.promises.readdir(folderPath, {
    withFileTypes: true,
  });
  contentDirectory.forEach(async (item) => {
    const fromPath = path.join(folderPath, item.name);
    const toPath = path.join(copyFolderPath, item.name);
    if (item.isFile()) {
      copyFile(fromPath, toPath);
    } else {
      await copyAssetsFolder(fromPath, toPath);
    }
  });
};

createFolder(outFolder)
  .then(() => createHtmlFile(htmlFileSrc, outHtmlFile))
  .then(() => createStyleFile(styleFileSrc, outFolder, 'style.css'))
  .then(() => copyAssetsFolder(assetsFolderSrc, outAssetsFolder))
  .then(() => stdout.write('Project is bundled!'));
