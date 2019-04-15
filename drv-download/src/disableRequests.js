module.exports = async (page) => {
  page.setDefaultNavigationTimeout(2000);
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().indexOf('openstreetmap.org') !== -1) {
      request.abort();
      return;
    }

    if (!['document', 'xhr', 'script'].includes(request.resourceType())) {
      request.abort();
      return;
    }

    request.continue();
  });
};