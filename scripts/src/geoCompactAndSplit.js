const fs = require('fs');
const promisify = require('util').promisify;
const copyFile = promisify(fs.copyFile);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

module.exports = async (drvBasePath, outputBasePath) => {
  const inputPS = JSON.parse(await readFile(drvBasePath + '/all-polling-stations.json'));
  const inputOkrugs = JSON.parse(await readFile(drvBasePath + '/all.json'));

  await copyFile(drvBasePath + '/all.json', outputBasePath + '/geo-okrugs.json');

  const geoLocationsOnly = {};
  const geoAreasOnly = {};
  const geoSpecialOnly = {};
  const geoOtherData = {};

  for (const row of inputPS) {
    if (!row.geometryLocation && !row.isSpecial) {
      debugger;
    }
    if (row.geometryLocation && row.geometryLocation.type !== 'Point') {
      debugger;
    }
    if (!row.geometryArea && !row.isSpecial) {
      debugger;
    }
    if (row.geometryArea && row.geometryArea.type !== 'Polygon' && row.geometryArea.type !== 'MultiPolygon') {
      debugger;
    }

    if (row.isSpecial) {
      // Looks like a bug in geo data in DRV
      // Most special polling stations don't have location and area - so let's delete for all of them
      delete row.geometryLocation;
      delete row.geometryArea;
    }

    const key = row.okrugNumber + ':' + row.numberNormalized;
    geoLocationsOnly[key] = !row.geometryLocation ? null : row.geometryLocation.coordinates;
    geoAreasOnly[key] = !row.geometryArea ? null : [row.geometryArea.type, row.geometryArea.coordinates];
    geoSpecialOnly[key] = row.isSpecial;
    
    // all other properties
    geoOtherData[key] = {};
    for (const field in row) {
      if (!row.hasOwnProperty(field)) {
        continue;
      }
      if (['geometryLocation', 'geometryArea', 'isSpecial'].includes(field)) {
        continue;
      }
      geoOtherData[key][field] = row[field];
    }
  }

  await writeFile(outputBasePath + '/geo-polling-stations-locations.json', JSON.stringify(geoLocationsOnly));
  await writeFile(outputBasePath + '/geo-polling-stations-areas.json', JSON.stringify(geoAreasOnly));
  await writeFile(outputBasePath + '/geo-polling-stations-special.json', JSON.stringify(geoSpecialOnly));
  await writeFile(outputBasePath + '/geo-polling-stations-other-data.json', JSON.stringify(geoOtherData));

};