const fs = require('fs');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const stringify = require('csv-stringify');

const file1 = 'all-2019-04-09T20-51-33.058Z.json';

const offset = 10;
const top = [
  5 + offset,   // Бойко
  14 + offset,  // Зеленский
  30 + offset,  // Порошенко
  36 + offset,  // Тимошенко
];

(async () => {

    let results = [];

    const text1 = await readFile(__dirname + '/data/' + file1, 'utf8');
    const data1 = JSON.parse(text1);

    for (const { tvo, matrix, head } of data1) {
      if (results.length === 0) {
        results.push([
          'Приделiть увагу до',
          'Округ',
          ...head,
        ]);
      }
      for (const row of matrix) {
        let looksStrange = [];
        for (const topCellIndex of top) {
          const topVotes = +row[topCellIndex];
          for (let i = topCellIndex - 2; i < topCellIndex + 3; i++) {
            // check +- 2 cells to left and to right of top candidates
            if (i === topCellIndex) {
              continue;
            }
            if (+row[i] > topVotes) {
              looksStrange.push(head[topCellIndex]);
              break;
            }
          }
        }
        if (looksStrange.length > 0) {
          results.push([
            looksStrange.join(', '),
            tvo.tvoNumber,
            ...row,
          ]);
        }
      }
    }

    results = results.map(row => row.map(cell => cell.replace(/\s+/g, ' ')));

    const dateLabel = new Date().toISOString().replace(/:/g,'-');
    await writeFile(__dirname + '/data/test-looks-strange---' + dateLabel + '.json', JSON.stringify(results));

    const csv = await new Promise(resolve => {
      stringify(results, (err, output) => {resolve(output);});
    });
    await writeFile(__dirname + '/data/test-looks-strange---' + dateLabel + '.csv', '\ufeff' + csv);
  
//    debugger;
  
  })();