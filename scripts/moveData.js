const fs = require('fs');
const promisify = require('util').promisify;
const copyFile = promisify(fs.copyFile);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

const protocolsIsUploaded = require('./src/protocols-is-uploaded');
const cvkCompact = require('./src/cvkCompact');
const geoCompactAndSplit = require('./src/geoCompactAndSplit');

const cvkFilePathEntireList = __dirname + '/../cvk-download/data/all-2019-04-09T20-51-33.058Z.json';
const cvkFilePathLast = __dirname + '/../cvk-download/data/all-2019-04-09T20-51-33.058Z.csv';
const evyboryFilePath = __dirname + '/../evybory-download/data/all.json';
const drvBasePath = __dirname + '/../drv-download/data';

const visualizationDataBasePath = __dirname + '/../visualization/public/data';
const visualizationStaticDataBasePath = __dirname + '/../visualization/public/static-data';

(async () => {

  // Create output dirs
  for (const dir of [visualizationDataBasePath, visualizationStaticDataBasePath]) {
    try {
      await mkdir(dir);
    } catch (e) {
      if (e.code !== 'EEXIST') {
        // throw errors other than "exists"
        throw e;
      }
    }
  }

  await copyFile(cvkFilePathLast, visualizationDataBasePath + '/cvk.csv');
  await copyFile(evyboryFilePath, visualizationDataBasePath + '/e-vybory.json');

  const cvkEntireList = JSON.parse(await readFile(cvkFilePathEntireList));
  const cvkEntireListCompact = cvkCompact(cvkEntireList);

  await geoCompactAndSplit(drvBasePath, visualizationStaticDataBasePath, cvkEntireListCompact);

  //await writeFile(visualizationStaticDataBasePath + '/cvk-polling-stations-entire-list.json', JSON.stringify(cvkEntireListCompact));

  const evybory = JSON.parse(await readFile(evyboryFilePath));

  const protocols = protocolsIsUploaded(cvkEntireListCompact, evybory);
  await writeFile(visualizationDataBasePath + '/protocols-is-uploaded.json', JSON.stringify(protocols));


})();
