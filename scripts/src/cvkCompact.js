module.exports = (raw) => {
  const data = [];
  for (const { tvo, matrix } of raw) {
    const okrugNumberNormalized = parseInt(tvo.tvoNumber, 10);
    for (const row of matrix) { 
      const psNumberNomalized = parseInt(row[0], 10);
      data.push([okrugNumberNormalized, psNumberNomalized]);
    }
  }

  return {
    _source: {
      link: 'https://cvk.gov.ua/pls/vp2019/wp001.html',
      copyright: 'ЦВК - WWW ІАС "Вибори Президента України"',
    },
    data: data,
  };
};