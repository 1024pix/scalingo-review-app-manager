const ReviewAppClient = require('./ReviewAppClient');
const JobManager = require('./JobManager');

class ReviewAppManager {

  _reviewAppClient = null;
  _jobManager = null;

  constructor(scalingToken, scalingoApiUrl, options = {}) {
    const ignoredReviewApps = options.ignoredReviewApps || [];
    const pollTimeInterval = options.pollTimeInterval || 1000;
    const pollMaxAttempts = options.pollMaxAttempts || 10;
    this._reviewAppClient = new ReviewAppClient(scalingToken, scalingoApiUrl, ignoredReviewApps, pollTimeInterval, pollMaxAttempts);

    const stopCronTime = options.stopCronTime || '0 0 19 * * 1-5';
    const restartCronTime = options.restartCronTime || '0 0 8 * * 1-5';
    this._jobManager = new JobManager(this._reviewAppClient, stopCronTime, restartCronTime);
  }

  startEcoMode() {
    this._jobManager.startJobs();
  }

  stopEcoMode() {
    this._jobManager.stopJobs();
  }

}

module.exports = ReviewAppManager;
