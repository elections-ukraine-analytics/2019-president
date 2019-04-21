const fs = require('fs');
const promisify = require('util').promisify;
const copyFile = promisify(fs.copyFile);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

module.exports = async (drvBasePath, outputBasePath, cvk) => {
  let skipped = 0;
  const inputPS = JSON.parse(await readFile(drvBasePath + '/all-polling-stations.json'));

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
    if (!cvk.data[key]) {
      skipped++;
      continue;
    }
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

  console.log('Geo skipped', skipped);

  await writeFile(outputBasePath + '/geo-polling-stations-locations.json', JSON.stringify(geoLocationsOnly));
  await writeFile(outputBasePath + '/geo-polling-stations-areas.json', JSON.stringify(geoAreasOnly));
  await writeFile(outputBasePath + '/geo-polling-stations-special.json', JSON.stringify(geoSpecialOnly));
  await writeFile(outputBasePath + '/geo-polling-stations-other-data.json', JSON.stringify(geoOtherData));


  const inputOkrugs = JSON.parse(await readFile(drvBasePath + '/all.json'));
  let plainListOkrugs = [];
  for (const region of inputOkrugs) {
    if (!region.okrugs) {
      continue;
    }
    plainListOkrugs = [...plainListOkrugs, ...region.okrugs];
  }

  plainListOkrugs = plainListOkrugs
    .map(row => {
      const ps = Object.keys(geoOtherData).map(key => geoOtherData[key]).filter(rowPS => rowPS.okrugNumber === row.okrugNumber);
      return {
        ...row,
        psList: ps.map(rowPS => rowPS.numberNormalized),
      }
    })
    .filter(row => row.psList.length > 0);
  await writeFile(outputBasePath + '/geo-okrugs.json', JSON.stringify(plainListOkrugs));
};