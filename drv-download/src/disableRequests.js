module.exports = async (page, log = false) => {
  page.setDefaultNavigationTimeout(2000);
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = request.url();
    if (url.indexOf('openstreetmap.org') !== -1) {
      request.abort();
      return;
    }

    const type = request.resourceType();
    if (!['document', 'xhr', 'script'].includes(type)) {
      request.abort();
      return;
    }

    if (log) {
      console.log(type, url);
    }

    request.continue();
  });
};