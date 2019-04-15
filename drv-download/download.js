const puppeteer = require('puppeteer');
const fs = require('fs');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);

const parseOkrugsRegion = require('./src/parseOkrugsRegion');
const parseGeo = require('./src/parseGeo');

const mainPage = 'https://www.drv.gov.ua/ords/portal/!cm_core.cm_index?option=ext_dvk&prejim=3';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
  });
  const page = await browser.newPage();
  await page.goto(mainPage);

  const allRegions = await page.$eval('table#tab1', $table => {
    console.log('a');
    const $rows = $table.querySelector('tbody').querySelectorAll('tr');
    const results = [];
    for (const $row of $rows) {
      if ($row.className === 'trlast') {
        continue;
      }
      const $cells = $row.querySelectorAll('td');
      if ($cells.length === 0) {
        continue;
      }
      const $link = $cells[0].querySelector('a');
      const regionName = $link.innerHTML.trim();
      const url = $link.href;
      results.push({
        regionName,
        url,
      });
    }
    return results;
  });

  await page.close();

  let parallel = [];
  for (let iRegion = 0; iRegion < allRegions.length; iRegion++) {
    const region = allRegions[iRegion];
    if (region.regionName === 'Закордонні виборчі дільниці') {
      continue;
    }
    const promise = (async () => {
      const page = await browser.newPage();

      const [geo] = await Promise.all([
        parseGeo.geoOkrugs(page),
        page.goto(region.url),
      ]);
      const data = await page.$eval('table#tab3', parseOkrugsRegion);

      const allOkrugsRegion = [];
      for (let i = 0; i < data.length; i++) {
        allOkrugsRegion[i] = {
          ...data[i],
          geometry: geo[data[i].okrugNumber].geometry,
        };
      }
      
      await page.close();

      allRegions[iRegion] = {
        ...region,
        okrugs: allOkrugsRegion,
      }

      return iRegion;
    })();
    parallel.push({
      promise,
      iRegion,
    });
    if (parallel.length > 7) {
      const done = await Promise.race(parallel.map(({ promise }) => promise));
      parallel = parallel.filter(r => r.iRegion !== done);
      console.log(done);
    }
  }
  await Promise.all(parallel.map(({ promise }) => promise));
  console.log('Done Regions + Okrugs');

  console.log(allRegions);

  // dilnyci

  await writeFile(__dirname + '/data/all.json', JSON.stringify(allRegions));

  //debugger;

  await browser.close();
})();