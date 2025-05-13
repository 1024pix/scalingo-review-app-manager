import { expect, sinon } from './testing.js';
import { CronJob } from 'cron';
import { Job } from '../lib/Job.js';

describe('Job', () => {

  describe('#constructor', () => {

    const name = 'my-job';
    const cronTime = '0 30 20 * * 1-5';
    const onTick = () => {
    };

    it('should keep an internal reference on given parameters', () => {
      // when
      const job = new Job(name, cronTime, onTick);

      // then
      expect(job.name).to.equal(name);
      expect(job.cron).to.be.an.instanceof(CronJob);
      expect(job.cron.cronTime.source).to.equal(cronTime);
      // The timezone is set to local by default, Europe/Paris for the dev, UTC in CI
      expect(job.cron.cronTime.timeZone).not.to.be.undefined;
    });

    it('should accept a valid time zone option', () => {
      // when
      const job = new Job(name, cronTime, onTick, { timeZone: 'Europe/Paris' });

      // then
      expect(job.cron.cronTime.timeZone).to.equal('Europe/Paris');
    });

    it('should fail when given an invalid time zone option', () => {
      try {
        // when
        new Job(name, cronTime, onTick, { timeZone: 'Invalid/Timezone' });
        expect.fail('an error to be thrown but was not');
      } catch (e) {
        // then
        expect(e.message).to.equal('Invalid timezone.');
      }
    });
  });

  describe('#start()', () => {

    it('should start each job manager’s tasks', () => {
      // given
      const cronJob = { start: sinon.stub() };
      const job = new Job('my-job', '0 30 20 * * 1-5', () => {
      });
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
      const job = new Job('my-job', '0 30 20 * * 1-5', () => {
      });
      job.cron = cronJob;

      // when
      job.stop();

      // then
      expect(cronJob.stop).to.have.been.calledOnce;
    });
  });
});
