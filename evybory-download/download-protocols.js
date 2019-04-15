const download = require('./src/download');

const configFactory = (name) => ({
  url: 'https://e-vybory.org/export/' + name,
  filePath: __dirname + '/data/' + name,
});

(async () => {
  await Promise.all([
    download(configFactory('protocol_form.csv')),
    download(configFactory('protocols_noerror.csv')),
    download(configFactory('protocols_witherrors.csv')),
  ]);
})();