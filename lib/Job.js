import { CronJob } from 'cron';

class Job {

  constructor(name, cronTime, onTick, options = {}) {
    this.name = name;
    this.cron = CronJob.from({cronTime, onTick, start: false, timeZone: options.timeZone});
  }

  start() {
    this.cron.start();
  }

  stop() {
    this.cron.stop();
  }
}

export { Job };
