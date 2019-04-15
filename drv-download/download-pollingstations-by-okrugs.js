const puppeteer = require('puppeteer');
const fs = require('fs');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

const parseGeo = require('./src/parseGeo');
const parsePollignStations = require('./src/parsePollingStations');
const disableRequests = require('./src/disableRequests');

(async () => {

  const json = await readFile(__dirname + '/data/all.json');
  const allOkrugsRegion = JSON.parse(json);

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
  });

  let allPollingStations = [];
  try {
    const json = await readFile(__dirname + '/data/all-polling-stations.json');
    allPollingStations = JSON.parse(json);
    console.log('Loaded ' + allPollingStations.length);
  } catch (e) {
    console.log('Fresh start');
  }

  let parallel = [];
  for (const region of allOkrugsRegion) {
    if (region.regionName === 'Закордонні виборчі дільниці') {
      continue;
    }
    for (const okrug of region.okrugs) {
      const { okrugNumber, url } = okrug;
      if (allPollingStations.some(r => r.okrugNumber === okrugNumber)) {
        console.log('Already have data for Okrug ' + okrugNumber);
        continue;
      }

      const promise = (async () => {
        const page = await browser.newPage();
        await disableRequests(page);
  
        const [geoPoly, geoMarker] = await Promise.all([
          parseGeo.geoPollingStationPoly(page),
          parseGeo.geoPollingStationMarker(page),
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
        const data = await page.$$eval('table#tab1', parsePollignStations);
        await page.close();
        
        if (geoPoly === false || geoMarker === false) {
          console.log(JSON.stringify(geoPoly), JSON.stringify(geoMarker));
          return {okrugNumber, result: false};
        }

        const result = [];
        for (const row of data) {
          const { number } = row;
          result.push({
            ...row,
            okrugNumber,
            geometryArea: geoPoly[number] && geoPoly[number].geometry,
            geometryLocation: geoMarker[number] && geoMarker[number].geometry,
          });
        }

        console.log(okrugNumber, result.length, url, 'done');

        return {okrugNumber, result};
      })();
      parallel.push({
        promise,
        okrugNumber,
      });
      if (parallel.length > 7) {
        const done = await Promise.race(parallel.map(({ promise }) => promise));
        parallel = parallel.filter(r => r.okrugNumber !== done.okrugNumber);
        if (done.result !== false) {
          allPollingStations = [...allPollingStations, ...done.result];
          await writeFile(__dirname + '/data/all-polling-stations.json', JSON.stringify(allPollingStations));
        } else {
          console.log('Problem with', done.okrugNumber, JSON.stringify(done.result));
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second
      }
    }
  }

  const last = await Promise.all(parallel.map(({ promise }) => promise));
  for (const done of last) {
    if (done.result !== false) {
      allPollingStations = [...allPollingStations, ...done.result];
      await writeFile(__dirname + '/data/all-polling-stations.json', JSON.stringify(allPollingStations));
    } else {
      console.log('Problem with', done.okrugNumber, JSON.stringify(done.result));
    }
  }

  console.log(allPollingStations);

  await writeFile(__dirname + '/data/all-polling-stations.json', JSON.stringify(allPollingStations));

  debugger;

  await browser.close();
})();