const fs = require('fs');
const path = require('path');
const { stdout } = require('process');

const srcFolder = path.join(__dirname, 'styles');
const distFolder = path.join(__dirname, 'project-dist');
const styleBundle = 'bundle.css';
const ext = 'css';

const getFileList = async (folder, ext) => {
  const contentDirectory = await fs.promises.readdir(folder, {
    withFileTypes: true,
  });
  const list = [];
  contentDirectory.forEach(async (item) => {
    const srcPath = path.join(folder, item.name);
    if (!item.isFile()) list.push(...(await getFileList(srcPath, ext)));
    if (path.extname(srcPath).substring(1) === ext) list.push(srcPath);
  });
  return list;
};

const bundle = async (srcFolder, distFolder, styleBundle, ext) => {
  const styleBundlePath = path.join(distFolder, styleBundle);
  await fs.promises.writeFile(styleBundlePath, '').catch((err) => errExit(err));
  const fileList = await getFileList(srcFolder, ext).catch((err) =>
    errExit(err),
  );
  const buf = [];
  for await (const file of fileList) {
    const wStream = fs.createWriteStream(styleBundlePath);
    const rStream = fs.createReadStream(file, 'utf8');
    rStream.on('data', (chunk) => buf.push(chunk));
    rStream.on('error', (error) => errExit(error));
    rStream.on('end', () => {
      for (let i = 0; i < buf.length; i++) {
        wStream.write(buf[i]);
      }
    });
  }
};

const errExit = (error) => {
  stdout.write('Error\n');
  stdout.write(error.message + '\n');
  process.exit(0);
};

bundle(srcFolder, distFolder, styleBundle, ext).then(() =>
  stdout.write('Styles is bundled!'),
);
