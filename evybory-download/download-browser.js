require('dotenv').config({ path: __dirname + '/../.env' });
const puppeteer = require('puppeteer');
const fs = require('fs');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);
const AWS = require('aws-sdk');

const disableRequests = require('./src/disableRequests');
const browserTables = require('./src/browserTables');

const maximumTablesPerOneLaunch = 10;

const urlTemplate = 'https://e-vybory.org/feed?region={region}&district=&station=&error=';
const urlTemplateMore = 'https://e-vybory.org/feed?page={page}&region={region}&district=&station=&error=';

const knownRegions = [
  "80", "5", "7", "12", "14", "18", "21",
  "23", "26", "32", "35", "44", "46", "48",
  "51", "53", "56", "59", "61", "63", "65",
  "68", "71", "73", "74", "99",
];


(async () => {

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
  });

  let allResult = {};
  for (const region of knownRegions) {
    const url = urlTemplate.replace('{region}', region);
    const page = await browser.newPage();
    disableRequests(page);
    let hasMore = true;
    let pageNumber = 1;
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    while (true) {
      const result = await page.$eval('table', $table => {
        let hasMore = true;
        const $rows = $table.querySelector('tbody').querySelectorAll('tr');
        const results = {};
        for (const $row of $rows) {
          const $cells = $row.querySelectorAll('td');
          if ($cells.length === 0) {
            continue;
          }
          if ($cells.length === 1) {
            hasMore = false;
            // stop;
            break;
          }
          // [area_code, ps_code, photo_slug, photo_date, has_errors, clarified, tables]
          const photo_date = $cells[0].innerText.trim();
          const area_code = $cells[2].innerText.trim();
          const ps_code = +$cells[3].innerText.trim() + '';
          const photos_number = $cells[5].innerHTML.match('camera').length;
          const tables_number = $cells[5].innerHTML.match('table').length;
          const photo_slug = $cells[0].querySelector('a').href.split('/').pop();

          const data = {
            area_code,
            ps_code,
            photo_slug,
            photo_date,
            photos_number,
            tables_number,
          };

          results[photo_slug] = data;
        }
        return {
          results,
          hasMore,
        };
      });

      const { results, hasMore } = result;
      for (const photo_slug of Object.keys(results)) {
        if (!allResult[photo_slug]) {
          allResult[photo_slug] = results[photo_slug];
          allResult[photo_slug].tables = {};
        } else {
          allResult[photo_slug] = {
            ...allResult[photo_slug],
            ...results[photo_slug],
          }
        }

      }
      if (!hasMore) {
        break;
      }
      pageNumber++;
      const nextUrl = urlTemplateMore.replace('{page}', pageNumber).replace('{region}', region);
      await page.goto(nextUrl, {waitUntil: 'domcontentloaded'});
    }

    await page.close();
  }

  await browserTables(browser, maximumTablesPerOneLaunch, allResult);

  await browser.close();

  //console.log(allResult);
/*
  let combined21April;
  let hasAnyUpdates = false;
  try {
    combined21April = JSON.parse(await readFile(__dirname + '/data/all-21-april.json'));
  } catch (e) {
    combined21April = {};
  }
  for (const { tvo:{ tvoNumber }, matrix } of results) {
    for (const row of matrix) {
      const numberNormalized = parseInt(row[0], 10);
      const totalVoters = parseInt(row[9], 10);
      const rZ = parseInt(row[11], 10);
      const rP = parseInt(row[12], 10);
      const protocolTimestamp = row[13];
      const key = tvoNumber + ':' + numberNormalized;
      const newLastCandidate = [area_code, ps_code, photo_slug, photo_date, has_errors, clarified, tables];
      if (!combined21April[key]) {
        combined21April[key] = {last: newLastCandidate, history: []};
        hasAnyUpdates = true;
      } else {
        let changes = false;
        for (let i = 0; i < newLastCandidate.length - 1; i++) {
          if (newLastCandidate[i] !== combined21April[key].last[i]) {
            changes = true;
            break;
          }
        }
        if (changes) {
          hasAnyUpdates = true;
          combined21April[key].history = [...combined21April[key].history, combined21April[key].last];
          combined21April[key].last = newLastCandidate;
        }
      }
    }
  }
*/

  if (!hasAnyUpdates) {
    console.log('No updates');
    return;
  }

  await writeFile(__dirname + '/data/browser-' + dateLabel + '.json', JSON.stringify(allResult));
/*
  const jsonData = JSON.stringify(combined21April);
  await writeFile(__dirname + '/data/all-21-april.json', jsonData);

  const s3 = new AWS.S3({apiVersion: '2006-03-01'});
  const Bucket = 'eua-evybory';
  const s3filename = 'e-vybory-' + dateLabel + '.json';

  await s3.putObject({
    Bucket,
    Key: 'data-dynamic/' + s3filename,
    ContentType: 'application/json',
    Expires: new Date('2038-01-17 00:00:00'),
    Body: jsonData,
  }).promise();

  await s3.putObject({
    Bucket,
    Key: 'manifests/e-vybory.json',
    ContentType: 'application/json',
    Body: JSON.stringify({ name: s3filename }),
  }).promise();

  console.log('Has updates. Upload completed');
*/
})();