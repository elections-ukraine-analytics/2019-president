const cvkCompact = require('./cvkCompact');

const evyboryCompact = (raw) => {
  const { _source, data } = raw;
  const result = {};

  for (const row of data) {
    const code = [row.area_code, row.ps_code];
    result[code.join(':')] = code;
  }

  return {
    _source,
    data: result,
  };
};


module.exports = (cvk, evybory) => {
  const cvkProtocols = cvkCompact(cvk);
  const evyboryProtocols = evyboryCompact(evybory);
  let counter = 0;

  const status = cvkProtocols.data.map(code => {
    const key = code.join(':');
    let uploaded = false;
    if (evyboryProtocols.data[key] !== undefined) {
      uploaded = true;
      counter++;
    }
    return [
      ...code,
      uploaded,
    ]
  });

  console.log(counter, 'of', cvkProtocols.data.length);

  return {
    _sources: [
      cvkProtocols._source,
      evyboryProtocols._source,
    ],
    status
  };
};