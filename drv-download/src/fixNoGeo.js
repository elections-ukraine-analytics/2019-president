const fs = require('fs');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const _ = require('lodash');

const parseGeo = require('./parseGeo');
const disableRequests = require('./disableRequests');

const onePSUrlTemplate = 'https://www.drv.gov.ua/ords/portal/!cm_core.cm_index?option=ext_dvk&pid100={pid100}&pf5242={numberNormalized}&prejim=3';

module.exports = async (browser, noGeoProblems) => {
  let knownNoGeo = [];
  try {
    const json = await readFile(__dirname + '/../data/no-geo.json');
    knownNoGeo = JSON.parse(json);
  } catch (e) {
    
  }

  const allNoGeo = _.unionBy(knownNoGeo, noGeoProblems, v => v.data.okrugNumber + ':' + v.data.numberNormalized);
  await writeFile(__dirname + '/../data/no-geo.json', JSON.stringify(allNoGeo));

  const result = [];

  for (const { pid100, data } of noGeoProblems) {
    const page = await browser.newPage();
    await disableRequests(page);

    const url = onePSUrlTemplate.replace('{pid100}', pid100).replace('{numberNormalized}', data.numberNormalized);

    const [{ geometryArea, geometryLocation }] = await Promise.all([
      parseGeo.geoPollingStationSinglePolyAndMarker(page),
      new Promise(async resolve => {
        try {
          await page.goto(url);
        } catch (e) {
          if (e.name !== 'TimeoutError') {
            debugger;
          }
        }
        resolve();
      }),
    ]);
    
    if (!geometryArea || !geometryLocation) {
      console.log('Still problem with geo');
      debugger;
      continue;
    } else {
      console.log('fixed', data.okrugNumber, data.numberNormalized);
    }

    result.push({
      ...data,
      geometryArea,
      geometryLocation,
    });

    await page.close();
  }

  return { result };
};