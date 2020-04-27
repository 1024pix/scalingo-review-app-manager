const ReviewAppClient = require('./ReviewAppClient');
const JobManager = require('./JobManager');

class ReviewAppManager {

  _reviewAppClient = null;
  _jobManager = null;

  constructor(scalingoToken, scalingoApiUrl, options = {}) {
    this._reviewAppClient = new ReviewAppClient(scalingoToken, scalingoApiUrl, options);
    this._jobManager = new JobManager(this._reviewAppClient, options);
  }

  startEcoMode() {
    this._jobManager.startJobs();
  }

  stopEcoMode() {
    this._jobManager.stopJobs();
  }

}

module.exports = ReviewAppManager;
