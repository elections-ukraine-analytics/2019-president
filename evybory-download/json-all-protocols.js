const fs = require('fs');
const parse = require('csv-parse');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);


const readFromCSV = async (filePath) => {
  const text = await readFile(filePath);
  const result = [];
  await new Promise(resolve => {
    parse(text, {trim: true, skip_empty_lines: true})
    .on('readable', function () {
      let record;
      while (record = this.read()) {
        result.push(record)
      };
    })
    .on('end', resolve);
  });
  return result;
};

const transformRowToObject = (row, headers) => {
  if (row.length !== headers.length) {
    throw "Number of header is not equal to number of data cells";
  }

  let result = {};
  for (let i = 0; i < headers.length; i++) {
    const name = headers[i];
    result[name] = row[i];
  }

  return result;
}

(async () => {
  const okProtocols = await readFromCSV(__dirname + '/data/protocols_noerror.csv');
  const withErrorsProtocols = await readFromCSV(__dirname + '/data/protocols_witherrors.csv');

  const result = [];
  let lastUpdateDate = null;
  for (const collection of [okProtocols, withErrorsProtocols]) {
    const headers = collection[0];
    for (let i = 1; i < collection.length; i++) {
      const row = transformRowToObject(collection[i], headers);
      for (const key of ['photo_date', 'table_date']) {
        if (lastUpdateDate === null || (row[key] && row[key] > lastUpdateDate)) {
          lastUpdateDate = row[key];
        }
      }
      result.push(row);
    }
  }

  await writeFile(__dirname + '/data/all.json', JSON.stringify({
    _source: {
      lastUpdateDate,
      link: 'https://e-vybory.org/export/',
      copyright: 'ГО «Електронна демократія»',
    },
    data: result,
  }));

  debugger;

})();