const { spawn } = require('child_process');

(async () => {
    while (true) {
      try {

        console.log('Run...');
        await new Promise(resolve => {
          const instance = spawn('node', [__dirname + '/download-browser.js']);

          instance.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
          });
  
          instance.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
          });
  
          instance.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            resolve();
          });
  
        })

      } catch (e) {
        console.log(e);
      }
      console.log('Wait 15 minutes...');
      await new Promise(resolve => setTimeout(resolve, 1000 * 60 * 15));
    }
  })();