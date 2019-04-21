const puppeteer = require('puppeteer');
const fs = require('fs');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);

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
  const dateLabel = new Date().toISOString().replace(/:/g,'-');

  await writeFile(__dirname + '/data/all-' + dateLabel + '.json', JSON.stringify(results));

  //debugger;

  await browser.close();
})();