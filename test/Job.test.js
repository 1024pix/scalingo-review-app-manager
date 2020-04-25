const { expect, sinon } = require('./testing');
const CronJob = require('cron').CronJob;
const Job = require('../lib/Job');

describe('Job', () => {

  describe('#constructor', () => {

    it('should keep an internal reference on given parameters', () => {
      // given
      const name = 'my-job';
      const cronTime = '0 30 20 * * 1-5';
      const onTick = () => {};

      // when
      const job = new Job(name, cronTime, onTick);

      // then
      expect(job.name).to.equal(name);
      expect(job.cron).to.be.an.instanceof(CronJob);
      expect(job.cron.cronTime.source).to.equal(cronTime);
      expect(job.cron.cronTime.zone).to.equal('Europe/Paris');
    });
  });

  describe('#start()', () => {

    it('should start each job manager’s tasks', () => {
      // given
      const cronJob = { start: sinon.stub() };
      const job = new Job('my-job', '0 30 20 * * 1-5', () => {});
      job.cron = cronJob;

      // when
      job.start();

      // then
      expect(cronJob.start).to.have.been.calledOnce;
    });
  });

  describe('#stop()', () => {

    it('should stop each job manager’s tasks', () => {
      // given
      const cronJob = { stop: sinon.stub() };
      const job = new Job('my-job', '0 30 20 * * 1-5', () => {});
      job.cron = cronJob;

      // when
      job.stop();

      // then
      expect(cronJob.stop).to.have.been.calledOnce;
    });
  });
});