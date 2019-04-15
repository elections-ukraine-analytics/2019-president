const fs = require('fs');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

//const file1 = 'all-2019-04-03T00-25-54.197Z.csv';
const file1 = 'results.csv';
const file2 = 'all-2019-04-09T20-51-33.058Z.csv';
//const file2 = 'results.csv';

let diffs = [];
for (let z = 0; z < 12 + 39; z++) {
  diffs[z] = 0;
}


(async () => {

  const text1 = await readFile(__dirname + '/data/' + file1, 'utf8');
  let data1 = text1.split("\n").map(r => r.split(','));
  let data2 = (await readFile(__dirname + '/data/' + file2, 'utf8')).split("\n").map(r => r.split(','));
  
  data1 = data1.map(rows => {
    rows.push(rows[3]);
    rows.splice(2, 2);
    return rows;
  });


  const result = [[...data2[0]]];

  for (let i = 1; i < data1.length; i++) {
    if (i % 100 === 0) {
      console.log(i, data1.length);
    }
    const cells1 = data1[i];
    const cells2 = data2.find(test2 => {
      if (cells1[0] === test2[0] && cells1[1] === test2[1]) {
        return true;
      }
      return false;
    });
    if (cells2 === undefined) {
      continue;
    }

    let differences = false;
    for (let i = 11; i < cells1.length - 1 || i < cells2.length - 1; i++) {
      if (cells1[i] !== cells2[i]) {
        differences = true;
      }
    }
    if (differences) {
      result.push(cells1);
      result.push(cells2);

      for (let z = 12; z < 12 + 39; z++) {
        diffs[z] += cells2[z] - cells1[z];
      }
    }
  }

//  debugger;
  await writeFile(__dirname + '/data/compare.csv', diffs.join(',') + "\n" + result.map(row => row.join(',')).join("\n"));

  console.log(diffs);
  debugger;

})();