const Job = require('./Job');

class JobManager {

  // Params
  _reviewAppClient;
  _stopCronTime;
  _restartCronTime;
  _timeZone;

  // Internals
  _jobs = [];

  constructor(reviewAppClient, options = {}) {
    this._reviewAppClient = reviewAppClient;
    this._stopCronTime = options.stopCronTime || '0 0 19 * * 1-5';
    this._restartCronTime = options.restartCronTime || '0 0 8 * * 1-5';
    this._timeZone = options.timeZone;

    const stopJob = new Job('stop-managed-review-apps', this._stopCronTime, async () => {
      return await this._reviewAppClient.stopAllReviewApps();
    }, { timeZone: this._timeZone });

    const restartJob = new Job('restart-managed-review-apps', this._restartCronTime, async () => {
      return await this._reviewAppClient.restartAllReviewApps();
    }, { timeZone: this._timeZone });

    this._jobs.push(stopJob, restartJob);
  }

  startJobs() {
    this._jobs.forEach((job) => {
      try {
        job.start();
        console.log(`Started job ${job.name} with cron time "${job.cron.cronTime}"`);
      } catch (err) {
        console.error(err);
      }
    });
  }

  stopJobs() {
    this._jobs.forEach((job) => {
      job.stop();
      console.log(`Stopped job ${job.name}`);
    });
  }

}

module.exports = JobManager;
