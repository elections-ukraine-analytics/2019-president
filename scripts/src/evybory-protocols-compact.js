
module.exports = (raw) => {
  const { _source, data } = raw;
  const result = {};

  for (const row of data) {
    const { area_code, ps_code, has_errors, photo_slug, table_slug } = row;
    const rZ = +row.r11_14;
    const rP = +row.r11_30;
    const rSum = Object.keys(row).filter(key => key.startsWith('r11_')).reduce((prevValue, curValue) => (prevValue + +row[curValue]), 0);
    const code = [area_code, ps_code];
    const key = code.join(':');
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push([area_code, ps_code, has_errors, photo_slug, table_slug, rZ, rP, rSum]);
  }

  return {
    _source,
    data: result,
  };
};