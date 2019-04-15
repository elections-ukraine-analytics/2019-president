module.exports = async (page) => {
  page.setDefaultNavigationTimeout(30000);
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (['document', 'manifest', 'other'].includes(req.resourceType())) {
      req.continue();
      return;
    }
    req.abort();
  });
};