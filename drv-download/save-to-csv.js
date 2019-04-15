const fs = require('fs');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);
const stringify = require('csv-stringify');
const all = require('./data/all-polling-stations.json');

(async () => {
  console.log(all);

  let plainMatrix = [
    ['OkrugNumberNormalized', 'PollingStationsNumberNormalized', 'areaDescriptionOrTitle', 'isSpecial', 'geometryLocation', 'geometryArea'],
  ];
  for (const row of all) {
    plainMatrix.push([
      row.okrugNumber,
      row.numberNormalized,
      row.areaDescriptionOrTitle.replace(/\s+/g, ' '),
      row.isSpecial === true ? 1 : 0,
      JSON.stringify(row.geometryLocation && row.geometryLocation.coordinates),
      JSON.stringify(row.geometryArea && row.geometryArea.coordinates),
    ]);
  }

  const csv = await new Promise(resolve => {
    stringify(plainMatrix, (err, output) => {resolve(output);});
  });
  await writeFile(__dirname + '/data/all-polling-stations.csv', '\ufeff' + csv);


})();