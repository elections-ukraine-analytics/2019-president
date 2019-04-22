module.exports = async (page, log = false) => {
  page.setDefaultNavigationTimeout(20000);
  await page.setRequestInterception(true);
  page.on('request', request => {
    /*
    const url = request.url();
    if (!url.includes('/feed')) {
      request.abort();
      return;
    }
    const type = request.resourceType();
    if (!['document'].includes(type)) {
      request.abort();
      return;
    }*/
    request.continue();
  });
};