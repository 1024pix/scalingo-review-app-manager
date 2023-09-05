const { expect, sinon } = require('./testing');
const Job = require('../lib/Job');
const JobManager = require('../lib/JobManager');
const logger = require('../lib/logger');


describe('JobManager', () => {

  afterEach(() => {
    sinon.restore();
  });

  describe('#constructor', () => {

    const reviewAppClient = { stubbed: 'reviewAppClient' };

    it('should keep an internal reference on given parameters', () => {
      // given
      const reviewAppClient = { stubbed: 'reviewAppClient' };
      const stopCronTime = '0 30 20 * * 1-5';
      const restartCronTime = '0 30 7 * * 1-5';
      const timeZone = 'Europe/Paris';

      // when
      const jobManager = new JobManager(reviewAppClient, { stopCronTime, restartCronTime, timeZone });

      // then
      expect(jobManager._reviewAppClient).to.deep.equal(reviewAppClient);
      expect(jobManager._stopCronTime).to.deep.equal(stopCronTime);
      expect(jobManager._restartCronTime).to.deep.equal(restartCronTime);
      expect(jobManager._timeZone).to.deep.equal(timeZone);
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
      const loggerInfoStub = sinon.stub(logger, 'info');
      const stubJob1 = new StubJob('stub-job-1');
      const stubJob2 = new StubJob('stub-job-2');

      const jobManager = new JobManager({});
      jobManager._jobs = [stubJob1, stubJob2];

      // when
      jobManager.startJobs();

      // then
      expect(stubJob1.start).to.have.been.calledOnce;
      expect(stubJob2.start).to.have.been.calledOnce;
      expect(loggerInfoStub.calledTwice).to.be.true;
      expect(loggerInfoStub.firstCall.args[0]).to.deep.equal({
        "event":"review-app-job-manager",
        "message": 'Started job stub-job-1 with cron time "0 0 19 * * 1,2,3,4,5"'
      });
      expect(loggerInfoStub.secondCall.args[0]).to.deep.equal({
        "event":"review-app-job-manager",
        "message": 'Started job stub-job-2 with cron time "0 0 19 * * 1,2,3,4,5"'
      });
    });

    it('should log error if job method start() raise an error', () => {
      // given
      const loggerInfoStub = sinon.stub(logger, 'info');
      const loggerErrorStub = sinon.stub(logger, 'error');
      const stubJob1 = new StubJob('stub-job-1');
      const stubJob2 = new StubJob('stub-job-2');
      const job2Error = new Error('Houston, we have a problem');
      stubJob2.start.throws(job2Error);

      const jobManager = new JobManager({});
      jobManager._jobs = [stubJob1, stubJob2];
      // when
      jobManager.startJobs();

      // then
      expect(stubJob1.start).to.have.been.calledOnce;
      expect(stubJob2.start).to.have.been.calledOnce;
      expect(loggerInfoStub.calledOnce).to.be.true;
      expect(loggerInfoStub.firstCall.args[0]).to.deep.equal({
        "event":"review-app-job-manager",
        "message": 'Started job stub-job-1 with cron time "0 0 19 * * 1,2,3,4,5"',
      });
      expect(loggerErrorStub.calledOnce).to.be.true;
      expect(loggerErrorStub.firstCall.args[0]).to.deep.equal({
        "event":"review-app-job-manager",
        "message": job2Error,
      });
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
      const loggerInfoStub = sinon.stub(logger, 'info');
      const stubJob1 = new StubJob('stub-job-1');
      const stubJob2 = new StubJob('stub-job-2');

      const jobManager = new JobManager({});
      jobManager._jobs = [stubJob1, stubJob2];

      // when
      jobManager.stopJobs();

      // then
      expect(stubJob1.stop).to.have.been.calledOnce;
      expect(stubJob2.stop).to.have.been.calledOnce;
      expect(loggerInfoStub.calledTwice).to.be.true;
      expect(loggerInfoStub.firstCall.args[0]).to.deep.equal({
        "event":"review-app-job-manager",
        "message": 'Stopped job stub-job-1'
      });
      expect(loggerInfoStub.secondCall.args[0]).to.deep.equal({
        "event":"review-app-job-manager",
        "message": 'Stopped job stub-job-2'
      });
    });
  });
});
