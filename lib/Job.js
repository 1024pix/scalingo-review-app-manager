const CronJob = require('cron').CronJob;

class Job {

  constructor(name, cronTime, onTick, options = {}) {
    this.name = name;
    this.cron = new CronJob(cronTime, onTick, null, false, options.timeZone);
  }

  start() {
    this.cron.start();
  }

  stop() {
    this.cron.stop();
  }
}

module.exports = Job;
