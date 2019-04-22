const puppeteer = require('puppeteer');
const fs = require('fs');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

const mainPage = 'https://www.cvk.gov.ua/pls/vp2019/wp001.html';
const linkNameWithDetails = 'На виборчих дільницях';

(async () => {

  const browser = await puppeteer.launch({
    headless: true,
    devtools: true,
  });
  const page = await browser.newPage();
  await page.goto(mainPage);

  await Promise.all([
    page.waitForNavigation(),
    page.evaluate(
      linkNameWithDetails => {
        const link = document.evaluate('//a[contains(text(),"' + linkNameWithDetails + '")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (!link.singleNodeValue) {
          throw "Cannot find link";
          return;
        }
        link.singleNodeValue.click();
      },
      [linkNameWithDetails]
    ),
  ]);

  const allTVO = await page.$eval('table', $table => {
    const $rows = $table.querySelector('tbody').querySelectorAll('tr');
    const results = [];
    for (const $row of $rows) {
      const $cells = $row.querySelectorAll('td');
      if ($cells.length !== 4) {
        continue;
      }
      const $link = $cells[1].querySelector('a');
      const id = results.length;
      results.push({
        id,
        tvoNumber: $cells[0].innerText.trim(),
        dilniciCount: $link && $link.innerText.trim(),
        url: $link && $link.href,
      });
    }
    return results;
  });

  await page.close();

  let results = [];
  let parallel = [];
  for (const tvo of allTVO) {
    if (!tvo.url) {
      continue;
    }
    const promise = (async () => {
      const page = await browser.newPage();
      await page.goto(tvo.url);
      const headAndMatrix = await page.$eval('table', $table => {
        const $head = [...$table.querySelector('thead').querySelectorAll('th')];
        const $rows = [...$table.querySelector('tbody').querySelectorAll('tr')];

        return {
          head: $head.map($cell => $cell.innerText.trim()),
          matrix: $rows.map($row => [...$row.querySelectorAll('td')].map($cell => $cell.innerText.trim())),
        };
      });
      await page.close();
      return {
        tvo,
        ...headAndMatrix
      };
    })();
    parallel.push({
      promise,
      id: tvo.id,
    });
    if (parallel.length > 7) {
      const done = await Promise.race(parallel.map(({ promise }) => promise));
      parallel = parallel.filter(r => r.id !== done.tvo.id);
      results = [...results, done];
      console.log('Done ' + results.length + ' of ' + allTVO.length);
    }
  }
  const doneList = await Promise.all(parallel.map(({ promise }) => promise));
  results = [...results, ...doneList];
  console.log('Done ' + results.length + ' of ' + allTVO.length);

  console.log(results);
  const dateTimeDownload = new Date().toISOString();
  const dateLabel = dateTimeDownload.replace(/:/g,'-');

  await writeFile(__dirname + '/data/all-' + dateLabel + '.json', JSON.stringify(results));

  //const dateTimeDownload = '2019-04-22T12:52:55.921Z';
  //const dateTimeDownload = '2019-04-22T13:02:41.544Z';
  //const dateLabel = dateTimeDownload.replace(/:/g,'-');
  //const results = JSON.parse(await readFile(__dirname + '/data/all-' + dateLabel + '.json'));

  let combined21April;
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
      const newLastCandidate = [tvoNumber, numberNormalized, totalVoters, rZ, rP, protocolTimestamp, dateTimeDownload];
      if (!combined21April[key]) {
        combined21April[key] = {last: newLastCandidate, history: []};
      } else {
        let changes = false;
        for (let i = 0; i < newLastCandidate.length - 1; i++) {
          if (newLastCandidate[i] !== combined21April[key].last[i]) {
            changes = true;
            break;
          }
        }
        if (changes) {
          combined21April[key].history = [...combined21April[key].history, combined21April[key].last];
          combined21April[key].last = [tvoNumber, numberNormalized, totalVoters, rZ, rP, protocolTimestamp, dateTimeDownload];
          debugger;
        }
      }
    }
  }
  await writeFile(__dirname + '/data/all-21-april.json', JSON.stringify(combined21April));

  //debugger;

  await browser.close();
})();