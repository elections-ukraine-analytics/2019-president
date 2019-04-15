const cvkCompact = require('./cvkCompact');

let repeated = 0;

const evyboryCompact = (raw) => {
  const { _source, data } = raw;
  const result = {};

  for (const row of data) {
    const code = [row.area_code, row.ps_code];
    const key = code.join(':');
    if (result[key]) {
      if (repeated < 5) {
        console.log('Repeated', key);
      }
      repeated++;

      if (result[key]['has_errors'] === '0' && row['has_errors'] === '0') {
        console.log('Repeated no errors', key);
      }

      if (result[key]['has_errors'] === '0' && row['has_errors'] === '1') {
        // do not replace without errors by record with errors
        continue;
      }
    }    
    result[key] = code;
  }

  return {
    _source,
    data: result,
  };
};


module.exports = (cvk, evybory) => {
  const evyboryProtocols = evyboryCompact(evybory);
  console.log('e-Vybory Repeated', repeated);
  let counter = 0;

  const cvkKeys = Object.keys(cvk.data);

  const status = cvkKeys.map(key => {
    let uploaded = false;
    if (evyboryProtocols.data[key] !== undefined) {
      uploaded = true;
      counter++;
    }
    return [
      ...cvk.data[key],
      uploaded,
    ]
  });

  console.log(counter, 'of', cvkKeys.length);

  return {
    _sources: [
      cvk._source,
      evyboryProtocols._source,
    ],
    status
  };
};