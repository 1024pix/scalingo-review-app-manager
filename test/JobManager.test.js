const { expect, sinon } = require('./testing');
const Job = require('../lib/Job');
const JobManager = require('../lib/JobManager');

describe('JobManager', () => {

  describe('#constructor', () => {

    const reviewAppClient = { stubbed: 'reviewAppClient' };
    const stopCronTime = '0 30 20 * * 1-5';
    const restartCronTime = '0 30 7 * * 1-5';

    it('should keep an internal reference on given parameters', () => {
      // given
      const reviewAppClient = { stubbed: 'reviewAppClient' };
      const stopCronTime = '0 30 20 * * 1-5';
      const restartCronTime = '0 30 7 * * 1-5';

      // when
      const jobManager = new JobManager(reviewAppClient, { stopCronTime, restartCronTime });

      // then
      expect(jobManager._reviewAppClient).to.deep.equal(reviewAppClient);
      expect(jobManager._stopCronTime).to.deep.equal(stopCronTime);
      expect(jobManager._restartCronTime).to.deep.equal(restartCronTime);
    });

    it('should manage a cron job to stop review apps', () => {
      // when
      const jobManager = new JobManager(reviewAppClient);

      // then
      const stoppingCronJob = jobManager._jobs.filter(j => j.name === 'stop-managed-review-apps')[0];
      expect(stoppingCronJob).to.exist;
    });

    it('should manage a cron job to restart review apps', () => {
      // when
      const jobManager = new JobManager(reviewAppClient);

      // then
      const stoppingCronJob = jobManager._jobs.filter(j => j.name === 'restart-managed-review-apps')[0];
      expect(stoppingCronJob).to.exist;
    });
  });

  describe('#startJobs()', () => {

    class StubJob extends Job {
      constructor(name) {
        super(name, '0 0 19 * * 1-5');
      }

      start = sinon.stub()
    }

    it('should start each job manager’s tasks', () => {
      // given
      const stubJob1 = new StubJob('stub-job-1');
      const stubJob2 = new StubJob('stub-job-2');

      const jobManager = new JobManager({});
      jobManager._jobs = [stubJob1, stubJob2];

      // when
      jobManager.startJobs();

      // then
      expect(stubJob1.start).to.have.been.calledOnce;
      expect(stubJob2.start).to.have.been.calledOnce;
    });
  });

  describe('#stopJobs()', () => {
    class StubJob extends Job {
      constructor(name) {
        super(name, '0 0 8 * * 1-5');
      }

      stop = sinon.stub()
    }

    it('should stop each job manager’s tasks', () => {
      // given
      const stubJob1 = new StubJob('stub-job-1');
      const stubJob2 = new StubJob('stub-job-2');

      const jobManager = new JobManager({});
      jobManager._jobs = [stubJob1, stubJob2];

      // when
      jobManager.stopJobs();

      // then
      expect(stubJob1.stop).to.have.been.calledOnce;
      expect(stubJob2.stop).to.have.been.calledOnce;
    });
  });
});