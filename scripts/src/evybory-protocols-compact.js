
module.exports = (raw) => {
  const { _source, data } = raw;
  const result = {};

  for (const row of data) {
    const { area_code, ps_code, has_errors, photo_slug, table_slug, photo_date, table_date } = row;
    const rZ = +row.r11_14;
    const rP = +row.r11_30;
    const rSum = Object.keys(row).filter(key => key.startsWith('r11_')).reduce((prevValue, curValue) => (prevValue + +row[curValue]), 0);
    const rppZ = Math.trunc(rZ * 10000 / rSum);
    const rppP = Math.trunc(rP * 10000 / rSum);
    const code = [area_code, ps_code];
    const key = code.join(':');
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push([area_code, ps_code, has_errors, photo_slug, table_slug, photo_date, table_date, rZ, rP, rSum, rppZ, rppP]);
  }

  return {
    _source,
    data: result,
  };
};