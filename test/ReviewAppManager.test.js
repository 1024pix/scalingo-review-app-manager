const  { expect, sinon } = require('./testing');
const ReviewAppManager = require('../lib/ReviewAppManager');
const ReviewAppClient = require('../lib/ReviewAppClient');
const JobManager = require('../lib/JobManager');

describe('ReviewAppManager', () => {

  describe('#constructor', () => {

    it('should set up default option values', () => {
      // when
      const reviewAppManager = new ReviewAppManager();

      // then
      expect(reviewAppManager._reviewAppClient).to.be.an.instanceof(ReviewAppClient);
      expect(reviewAppManager._reviewAppClient._ignoredReviewApps).to.be.an('array').that.is.empty;
      expect(reviewAppManager._reviewAppClient._pollTimeInterval).to.equal(1000);
      expect(reviewAppManager._reviewAppClient._pollMaxAttempts).to.equal(10);

      expect(reviewAppManager._jobManager).to.be.an.instanceof(JobManager);
      expect(reviewAppManager._jobManager._stopCronTime).to.equal('0 0 19 * * 1-5');
      expect(reviewAppManager._jobManager._restartCronTime).to.equal('0 0 8 * * 1-5');
    });
  });

  describe('#startEcoMode()', () => {

    it('should start each job manager’s tasks', () => {
      // given
      const reviewAppManager = new ReviewAppManager();
      const jobManager = { startJobs: sinon.stub() };
      reviewAppManager._jobManager = jobManager;

      // when
      reviewAppManager.startEcoMode();

      // then
      expect(jobManager.startJobs).to.have.been.calledOnce;
    });
  });

  describe('#stopEcoMode()', () => {

    it('should stop each job manager’s tasks', () => {
      // given
      const reviewAppManager = new ReviewAppManager();
      const jobManager = { stopJobs: sinon.stub() };
      reviewAppManager._jobManager = jobManager;

      // when
      reviewAppManager.stopEcoMode();

      // then
      expect(jobManager.stopJobs).to.have.been.calledOnce;
    });
  });
});