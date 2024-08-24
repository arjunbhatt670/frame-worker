const { parentPort } = require('worker_threads');

class VideoProcessor {
    constructor(frameRate, duration) {
        this.frameRate = frameRate;
        this.duration = duration;
        this.frameInterval = 1000 / frameRate;  // Time per frame in milliseconds
        this.totalFrames = frameRate * duration;
        this.frame = 0;
        this.isPaused = false;
        this.startTime = null;
    }

    start(fromTime = 0) {
        this.frame = Math.floor((fromTime / 1000) * this.frameRate);
        this.isPaused = false;
        this.startTime = performance.now() - (this.frame * this.frameInterval);
        this.processNextFrame();
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
        this.startTime = performance.now() - (this.frame * this.frameInterval);
        this.processNextFrame();
    }

    restart() {
        this.frame = 0;
        this.isPaused = false;
        this.startTime = performance.now();
        this.processNextFrame();
    }

    processNextFrame() {
        if (this.isPaused) return;

        const currentTime = performance.now();
        const elapsedTime = currentTime - this.startTime;

        const expectedFrame = Math.floor(elapsedTime / this.frameInterval);

        while (this.frame < expectedFrame && this.frame < this.totalFrames) {
            parentPort.postMessage({ frame: this.frame });
            this.frame++;
        }

        if (this.frame < this.totalFrames) {
            const nextFrameTime = this.startTime + (this.frame * this.frameInterval);
            const delay = nextFrameTime - performance.now();

            if (delay > 0) {
                setTimeout(() => this.processNextFrame(), delay);
            } else {
                setTimeout(() => this.processNextFrame(), 0);
            }
        } else {
            parentPort.postMessage({ done: true });
        }
    }
}

let videoProcessor;

const onmessage = function (e) {
    const { command, frameRate, duration, fromTime } = e.data;

    if (!videoProcessor) {
        videoProcessor = new VideoProcessor(frameRate, duration);
    }

    switch (command) {
        case 'start':
            videoProcessor.start(fromTime);
            break;
        case 'pause':
            videoProcessor.pause();
            break;
        case 'resume':
            videoProcessor.resume();
            break;
        case 'restart':
            videoProcessor.restart();
            break;
        default:
            parentPort.postMessage({ done: true });
    }
};

parentPort.on('message', onmessage);