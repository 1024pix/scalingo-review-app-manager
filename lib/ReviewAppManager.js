import { ReviewAppClient} from './ReviewAppClient.js';
import { JobManager} from './JobManager.js';

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

export { ReviewAppManager };
