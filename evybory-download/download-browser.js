const a = require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);
const AWS = require('aws-sdk');

const disableRequests = require('./src/disableRequests');

const urlTemplate = 'https://e-vybory.org/feed?region={region}&district=&station=&error=';
const urlTemplateMore = 'https://e-vybory.org/feed?page={page}&region={region}&district=&station=&error=';

const knownRegions = [
  "80", "5", "7", "12", "14", "18", "21",
  "23", "26", "32", "35", "44", "46", "48",
  "51", "53", "56", "59", "61", "63", "65",
  "68", "71", "73", "74", "99",
];


(async () => {
/*
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
  });

  let allResult = [];
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
        const results = [];
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
          const lastUpdate = $cells[0].innerText.trim();
          const area_code = $cells[2].innerHTML.trim();
          const ps_code = +$cells[3].innerHTML.trim() + '';
          results.push({
            area_code,
            ps_code,
            lastUpdate,
          });
        }
        return {
          results,
          hasMore,
        };
      });
      allResult = [...allResult, ...result.results];
      hasMore = result.hasMore;
      if (!hasMore) {
        break;
      }
      pageNumber++;
      const nextUrl = urlTemplateMore.replace('{page}', pageNumber).replace('{region}', region);
      await page.goto(nextUrl, {waitUntil: 'domcontentloaded'});
    }

    await page.close();
  }

  console.log(allResult);

  await writeFile(__dirname + '/data/all-browser.json', JSON.stringify(allResult));
  await browser.close();
*/

  const s3 = new AWS.S3({apiVersion: '2006-03-01', region: 'eu-central-1'});
  const Bucket = 'eua-evybory';
  const Key = 'e-vybory---' + (new Date().toISOString().replace(/:/g,'-')) + '.json';
  const params = {
    Bucket,
    Key,
    Body: 'test',
    ContentType: "application/json",
  };
  try {
    await s3.putObject(params).promise();
    await s3.putObject({
      Bucket,
      Key: 'manifest.json',
      Body: JSON.stringify({ Key }),
      ContentType: "application/json",
    }).promise();
  } catch (e) {
    debugger;
  }

})();