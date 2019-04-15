const puppeteer = require('puppeteer');
const fs = require('fs');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

const parseGeo = require('./src/parseGeo');
const parsePollignStations = require('./src/parsePollingStations');
const disableRequests = require('./src/disableRequests');
const fixNoGeo = require('./src/fixNoGeo');

(async () => {

  const json = await readFile(__dirname + '/data/all.json');
  const allOkrugsRegion = JSON.parse(json);

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
  });

  let allPollingStations = [];
  let noGeoProblems = [];
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
      console.log('Okrug', okrugNumber);
      const hasPS = {};
      const hasProblems = {};
      if (!Array.isArray(allPollingStations)) {
        debugger;
      }
      for (const r of allPollingStations) {
        const key = r.okrugNumber + ':' + r.numberNormalized;
        if (r.okrugNumber !== okrugNumber) {
          continue;
        }
        if (r.isSpecial) {
          // doesn't make sense to check geometryArea and geometryLocation for special polling stations because of bug in data in DRV
          hasPS[key] = r;
          continue;
        }

        if (r.geometryArea && r.geometryLocation) {
          hasPS[key] = r;
          continue;
        }

        hasProblems[key] = r;
      };
      const hasPSLength = Object.keys(hasPS).length;
      const hasProblemsLength = Object.keys(hasProblems).length;
      let replaceOnly = false;
      if (hasPSLength > 0) {
        console.log('Already have data for Okrug ' + okrugNumber + ' - ' + hasPSLength + ':' + hasProblemsLength);
        replaceOnly = true;
      }
      if (hasProblemsLength === 0) {
        continue;
      } else {
        console.log('Has problems');
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
          const { number, numberNormalized, isSpecial } = row;
          const key = okrugNumber + ':' + numberNormalized;
          if (replaceOnly && !hasProblems[key]) {
            continue;
          }
          if (!isSpecial && (!geoMarker[number] || !geoPoly[number])) {
            console.log(okrugNumber, number, url, 'no geo');
            const parsePid100 = url.match(/\&pid100=(\d+)/);
            if (!parsePid100) {
              debugger;
            }
            const pid100 = parsePid100 && parsePid100[1];
            noGeoProblems.push({
              url,
              pid100,
              data: { ...row, okrugNumber}
            });
            if (replaceOnly) {
              continue;
            }
          }
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
        allPollingStations = await processOnePromiseResult(allPollingStations, done);
      }
    }
  }

  const last = await Promise.all(parallel.map(({ promise }) => promise));
  for (const done of last) {
    allPollingStations = await processOnePromiseResult(allPollingStations, done);
  }

  const fixResults = await fixNoGeo(browser, noGeoProblems);
  allPollingStations = await processOnePromiseResult(allPollingStations, fixResults);

  console.log(allPollingStations);

  debugger;

  await browser.close();
})();

async function processOnePromiseResult(allPollingStations, done) {
  if (done.result === false) {
    console.log('Problem with', done.okrugNumber, JSON.stringify(done.result));
    return allPollingStations;
  }

  if (done.result.length === 0) {
    console.log('Skip, no new records');
    return allPollingStations;
  }

  const oldLen = allPollingStations.length;
  allPollingStations = allPollingStations.filter(r => !done.result.some(dr => r.okrugNumber === dr.okrugNumber && r.numberNormalized === dr.numberNormalized));
  const newLen = allPollingStations.length;
  let hasChanges = false;
  if (oldLen !== newLen) {
    console.log('Removed', oldLen - newLen);
  }
  allPollingStations = [...allPollingStations, ...done.result];
  if (newLen !== allPollingStations.length) {
    console.log('Added', allPollingStations.length - newLen, done.result.length);
  }
  try {
    await writeFile(__dirname + '/data/all-polling-stations.json', JSON.stringify(allPollingStations));
    await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second
  } catch (e) {
    debugger;
  }

  return allPollingStations;
}