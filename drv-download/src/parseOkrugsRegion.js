module.exports = $table => {
  const $rows = $table.querySelector('tbody').querySelectorAll('tr');
  const results = [];
  for (let i = 0; i < $rows.length - 1; i++) {
    const $row = $rows[i];
    const $cells = $row.querySelectorAll('td');
    if ($cells.length === 0) {
      continue;
    }
    const $link = $cells[0].querySelector('a');
    const url = $link.href;
    const okrugName = $link.innerHTML.trim();
    const parseOkrugNumber = okrugName.match(/№(\d+)/);
    if (!parseOkrugNumber) {
      debugger;
    }
    const okrugNumber = parseOkrugNumber && parseOkrugNumber[1];
    const okrugDescription = $cells[1].innerText.trim();

    results.push({
      okrugName,
      okrugNumber,
      okrugDescription,
      url,
    });
  }
  return results;
};