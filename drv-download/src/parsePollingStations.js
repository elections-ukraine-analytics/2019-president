module.exports = $tables => {
  const results = [];
  for (let iTable = 0; iTable < $tables.length; iTable++) {
    const $table = $tables[iTable];
    const $rows = $table.querySelector('tbody').querySelectorAll('tr');
    for (let i = 0; i < $rows.length - 1; i++) {
      const $row = $rows[i];
      const $cells = $row.querySelectorAll('td');
      if ($cells.length === 0) {
        continue;
      }
  
      const number = $cells[0].innerHTML.trim();
      const numberNormalized = parseInt(number, 10);
      const areaDescriptionOrTitle = $cells[1].innerHTML.trim();
      const location = $cells[2].innerHTML.trim();
      const size = $cells[3].innerHTML.trim();
      const isSpecial = iTable === 1;
  
      results.push({
        number,
        numberNormalized,
        areaDescriptionOrTitle,
        location,
        size,
        isSpecial,
      });
    }
  
  }
  return results;
};