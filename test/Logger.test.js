import { expect, sinon } from './testing.js';
import { logger } from '../lib/Logger.js';

describe('logger', function () {
  describe('error', function () {
    describe('when an message is passed', function () {
      it('should call injectedLogger error', function () {
        // given
        const injectedLogger = { error: sinon.stub() };

        // when
        logger.error({ event: 'toto', message: 'titi', app: 'app' }, injectedLogger);
        // then
        expect(injectedLogger.error.calledOnce).to.be.true;
        expect(injectedLogger.error.firstCall.args[0]).to.equal(
          '{"event":"toto","message":"titi","app":"app","level":"error"}',
        );
      });
    });
    describe('when an object is passed', function () {
      it('should call injectedLogger error with object in message', function () {
        // given
        const injectedLogger = { error: sinon.stub() };

        // when
        logger.error({ event: 'toto', message: { foo: 'bar' }, app: 'app' }, injectedLogger);

        // then
        expect(injectedLogger.error.calledOnce).to.be.true;
        expect(injectedLogger.error.firstCall.args[0]).to.equal(
          '{"event":"toto","message":"{\\"foo\\":\\"bar\\"}","app":"app","level":"error"}',
        );
      });
    });
  });
  describe('info', function () {
    describe('when an message is passed', function () {
      it('should call injectedLogger log', function () {
        // given
        const injectedLogger = { log: sinon.stub() };

        // when
        logger.info({ event: 'toto', message: 'titi', app: 'app' }, injectedLogger);

        // then
        expect(injectedLogger.log.calledOnce).to.be.true;
        expect(injectedLogger.log.firstCall.args[0]).to.equal(
          '{"event":"toto","message":"titi","app":"app","level":"info"}',
        );
      });
    });
    describe('when an object is passed', function () {
      it('should call injectedLogger log with object in message', function () {
        // given
        const injectedLogger = { log: sinon.stub() };

        // when
        logger.info({ event: 'toto', message: { foo: 'bar' }, app: 'app' }, injectedLogger);

        // then
        expect(injectedLogger.log.calledOnce).to.be.true;
        expect(injectedLogger.log.firstCall.args[0]).to.equal(
          '{"event":"toto","message":"{\\"foo\\":\\"bar\\"}","app":"app","level":"info"}',
        );
      });
    });
  });
  describe('warn', function () {
    describe('when an message is passed', function () {
      it('should call injectedLogger warn', function () {
        // given
        const injectedLogger = { warn: sinon.stub() };

        // when
        logger.warn({ event: 'toto', message: 'titi', app: 'app' }, injectedLogger);

        // then
        expect(injectedLogger.warn.calledOnce).to.be.true;
        expect(injectedLogger.warn.firstCall.args[0]).to.equal(
          '{"event":"toto","message":"titi","app":"app","level":"warn"}',
        );
      });
    });
    describe('when an object is passed', function () {
      it('should call injectedLogger warn with object in message', function () {
        // given
        const injectedLogger = { warn: sinon.stub() };

        // when
        logger.warn({ event: 'toto', message: { foo: 'bar' }, app: 'app' }, injectedLogger);

        // then
        expect(injectedLogger.warn.calledOnce).to.be.true;
        expect(injectedLogger.warn.firstCall.args[0]).to.equal(
          '{"event":"toto","message":"{\\"foo\\":\\"bar\\"}","app":"app","level":"warn"}',
        );
      });
    });
  });
  describe('ok', function () {
    describe('when an message is passed', function () {
      it('should call injectedLogger ok', function () {
        // given
        const injectedLogger = { log: sinon.stub() };

        // when
        logger.ok({ event: 'toto', message: 'titi', app: 'app' }, injectedLogger);

        // then
        expect(injectedLogger.log.calledOnce).to.be.true;
        expect(injectedLogger.log.firstCall.args[0]).to.equal(
          '{"event":"toto","message":"titi","app":"app","level":"ok"}',
        );
      });
    });
    describe('when an object is passed', function () {
      it('should call injectedLogger ok with object in message', function () {
        // given
        const injectedLogger = { log: sinon.stub() };

        // when
        logger.ok({ event: 'toto', message: { foo: 'bar' }, app: 'app' }, injectedLogger);

        // then
        expect(injectedLogger.log.calledOnce).to.be.true;
        expect(injectedLogger.log.firstCall.args[0]).to.equal(
          '{"event":"toto","message":"{\\"foo\\":\\"bar\\"}","app":"app","level":"ok"}',
        );
      });
    });
  });
});
