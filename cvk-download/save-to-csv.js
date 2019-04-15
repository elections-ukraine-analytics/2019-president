const fs = require('fs');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);
const stringify = require('csv-stringify');
const all = require('./data/all-2019-04-09T20-51-33.058Z.json');

(async () => {
  console.log(all);

  const head = all[0].head;
  for (let i = 1; i < all.length; i++) {
    for (let j = 0; j < head.length; j++) {
      if (head[j] !== all[i].head[j]) {
        console.error('Different headers');
        debugger;
      }
    }
  }


  let plainMatrix = [
    ['ТВО', ...head],
  ];
  for (const { tvo, matrix } of all) {
    for (const cells of matrix ) {
      plainMatrix.push([
        tvo.tvoNumber,
        ...cells
      ]);
    }
  }

  plainMatrix = plainMatrix.map(row => row.map(cell => cell.replace(/\s+/g, ' ')));

  const csv = await new Promise(resolve => {
    stringify(plainMatrix, (err, output) => {resolve(output);});
  });
  await writeFile(__dirname + '/data/all-2019-04-09T20-51-33.058Z.csv', '\ufeff' + csv);


})();