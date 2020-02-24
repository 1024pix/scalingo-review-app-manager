const Job = require('./Job');

class JobManager {

  // Params
  _reviewAppClient = null;
  _stopCronTime = null;
  _restartCronTime = null;

  // Internals
  _jobs = [];

  constructor(reviewAppClient, stopCronTime, restartCronTime) {
    this._reviewAppClient = reviewAppClient;
    this._stopCronTime = stopCronTime;
    this._restartCronTime = restartCronTime;

    const stopJob = new Job('stop-managed-review-apps', stopCronTime, async () => {
      return await this._reviewAppClient.stopAllReviewApps();
    });

    const restartJob =  new Job('restart-managed-review-apps', restartCronTime, async () => {
      return await this._reviewAppClient.restartAllReviewApps();
    });

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
