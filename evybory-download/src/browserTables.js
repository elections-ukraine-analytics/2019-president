const disableRequests = require('./disableRequests');


const urlTemplateDetails = 'https://e-vybory.org/view/{photo_slug}';
const urlTemplateDetailsTable = 'https://e-vybory.org/view-data/{table_slug}';

module.exports = (browser, maximumTablesPerOneLaunch, allResult) => {
  let completedRequests = 0;

  for (const key of Object.keys(allResult)) {
    const { photo_slug, tables, tables_number } = allResult[key];

    if (tables.length === tables_number) {
      continue;
    }

    const url = urlTemplateDetails.replace('{photo_slug}', photo_slug);
    const page = await browser.newPage();
    disableRequests(page);
    await page.goto(url, {waitUntil: 'domcontentloaded'});

    const tableSlugs = await page.evaluate(() => {
      const $links = document.querySelectorAll('a');
      const tableSlugs = [];
      for (const $link of [...$links]) {
        if (!$link.innerText.trim().startsWith('Оцифровано:')) {
          continue;
        }
        
        const url = $link.href;
        const table_slug = url.split('/').pop();
        tableSlugs.push(table_slug);
      }
      return tableSlugs;
    });

    await page.close();

    const newTables = {};
    for (const table_slug of tableSlugs) {
      if (tables[table_slug]) {
        // we have data about this table
        continue;
      }

      completedRequests++;
      console.log('table_slug', table_slug);
      const url = urlTemplateDetailsTable.replace('{table_slug}', table_slug);
      const page = await browser.newPage();
      disableRequests(page);
      await page.goto(url, {waitUntil: 'domcontentloaded'});

      const fields = await page.$$eval('input[type=text]', $fields => {
        const result = {};

        result['table_date'] = document.querySelector('.form-tail p').innerText.trim().split('від').pop().trim();

        for (const $field of [...$fields]) {
          const { id, value } = $field;
          result[id] = value;
        }
        return result;
      });

      await page.close();

      newTables[table_slug] = {
        table_slug,
        ...fields,
      }
    }

    allResult[key].tables_number = newTables.length;
    allResult[key].tables = newTables;
    
    if (completedRequests > maximumTablesPerOneLaunch) {
      break;
    }
  }
  
};