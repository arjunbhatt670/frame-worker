const path = require('path');
const { Worker } = require('worker_threads')


const frameWorker = new Worker(path.resolve(__dirname, "frameWorker.js"));

var time = performance.now();

frameWorker.on('message', (message) => {
  console.log(message);

  // Do any async work here

  if (message.done) {
    frameWorker.terminate();
    console.log('Total worker time', Math.floor(performance.now() - time), ms)
  }
});

frameWorker.onerror = (error) => {
  console.log(error);
};

frameWorker.postMessage({ data: { frameRate: 120, duration: 1, command: 'start' } });
