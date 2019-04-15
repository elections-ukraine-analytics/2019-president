const fs = require('fs');
const promisify = require('util').promisify;
const copyFile = promisify(fs.copyFile);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const protocolsIsUploaded = require('./src/protocols-is-uploaded');
const cvkCompact = require('./src/cvkCompact');

const cvkFilePathEntireList = __dirname + '/../cvk-download/data/all-2019-04-09T20-51-33.058Z.json';
const cvkFilePathLast = __dirname + '/../cvk-download/data/all-2019-04-09T20-51-33.058Z.csv';
const evyboryFilePath = __dirname + '/../evybory-download/data/all.json';
const drvFilePath = __dirname + '/../drv-download/data/all-polling-stations.json';

(async () => {
  await copyFile(cvkFilePathLast, __dirname + '/../visualization/public/data/cvk.csv');
  await copyFile(evyboryFilePath, __dirname + '/../visualization/public/data/e-vybory.json');
  await copyFile(drvFilePath, __dirname + '/../visualization/public/static-data/geo-polling-stations.json');

  const cvkEntireList = JSON.parse(await readFile(cvkFilePathEntireList));
  const cvkEntireListCompact = cvkCompact(cvkEntireList);
  await writeFile(__dirname + '/../visualization/public/static-data/cvk-polling-stations-entire-list.json', JSON.stringify(cvkEntireListCompact));

  const evybory = JSON.parse(await readFile(evyboryFilePath));

  const protocols = protocolsIsUploaded(cvkEntireList, evybory);
  await writeFile(__dirname + '/../visualization/public/data/protocols-is-uploaded.json', JSON.stringify(protocols));


})();
