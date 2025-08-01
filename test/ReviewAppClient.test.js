import { expect, nock, catchErr, sinon } from './testing.js';
import { ReviewAppClient} from '../lib/ReviewAppClient.js';
import { logger } from '../lib/Logger.js';

describe('ReviewAppClient', () => {

  const scalingoToken = 'scalingo-token';
  const scalingoApiUrl = 'https://scalingo.api.url';

  beforeEach(() => {
    nock('https://auth.scalingo.com')
      .post('/v1/tokens/exchange')
      .reply(200, {
        "token": "your-bearer-token"
      });
  });

  afterEach(() => {
    nock.cleanAll();
    sinon.restore();
  });

  describe('#scale()', () => {

    const app = { name: 'my-review-app' };
    const formation = [{ name: 'web', amount: 0 }];

    it('should call Scalingo API through the Scalingo client `Containers` services', async () => {
      // given
      const loggerInfoStub = sinon.stub(logger, 'info');
      const loggerOkStub = sinon.stub(logger, 'ok');
      const scope = nock(scalingoApiUrl)
        .post(`/v1/apps/${app.name}/scale`)
        .reply(202, {}, {
          "Location": `${scalingoApiUrl}/v1/${app.name}/operations/operation-id`
        })
        .get(`/v1/${app.name}/operations/operation-id`)
        .reply(200, {
          "operation": {
            "status": "done",
          }
        });

      const reviewAppClient = new ReviewAppClient(scalingoToken, scalingoApiUrl);

      // when
      await reviewAppClient.scale(app, formation);

      // then
      scope.isDone();
      expect(loggerInfoStub.calledOnce).to.be.true;
      expect(loggerOkStub.calledOnce).to.be.true;
      expect(loggerInfoStub.firstCall.args[0]).to.deep.equal({
        "event": "review-app-manager",
        "app": 'my-review-app',
        "message":"Scaling app my-review-app to 0 container(s)…"
      });
      expect(loggerOkStub.firstCall.args[0]).to.deep.equal({
        "event": "review-app-manager",
        "app": 'my-review-app',
        "message":"App my-review-app scaled successfully"
      });
    });

    it('should await for scaling operation to be `done` and poll-check it until it is', async () => {
      // given
      const loggerInfoStub = sinon.stub(logger, 'info');
      const loggerOkStub = sinon.stub(logger, 'ok');
      const scope = nock(scalingoApiUrl)
        .post(`/v1/apps/${app.name}/scale`)
        .reply(202, {}, {
          "Location": `${scalingoApiUrl}/v1/${app.name}/operations/operation-id`
        })
        .get(`/v1/${app.name}/operations/operation-id`)
        .thrice()
        .reply(200, {
          "operation": {
            "status": "pending",
          }
        })
        .get(`/v1/${app.name}/operations/operation-id`)
        .once()
        .reply(200, {
          "operation": {
            "status": "done",
          }
        });

      const reviewAppClient = new ReviewAppClient(scalingoToken, scalingoApiUrl, {
        pollTimeInterval: 10
      });

      // when
      await reviewAppClient.scale(app, formation);

      // then
      scope.isDone();
      expect(loggerInfoStub.calledOnce).to.be.true;
      expect(loggerOkStub.calledOnce).to.be.true;
      expect(loggerInfoStub.firstCall.args[0]).to.deep.equal({
        "event": "review-app-manager",
        "app": 'my-review-app',
        "message":"Scaling app my-review-app to 0 container(s)…"
      });
      expect(loggerOkStub.firstCall.args[0]).to.deep.equal({
        "event": "review-app-manager",
        "app": 'my-review-app',
        "message":"App my-review-app scaled successfully"
      });
    });

    it('should resolve when the scaling doesn\'t return an operation', async () => {
      // given
      const loggerInfoStub = sinon.stub(logger, 'info');
      const loggerOkStub = sinon.stub(logger, 'ok');
      const scope = nock(scalingoApiUrl)
        .post(`/v1/apps/${app.name}/scale`)
        .reply(202);

      const reviewAppClient = new ReviewAppClient(scalingoToken, scalingoApiUrl, {
        pollTimeInterval: 10
      });

      // when
      await reviewAppClient.scale(app, formation);

      // then
      scope.isDone();
      expect(loggerInfoStub.calledOnce).to.be.true;
      expect(loggerOkStub.calledOnce).to.be.true;
      expect(loggerInfoStub.firstCall.args[0]).to.deep.equal({
        "event": "review-app-manager",
        "app": 'my-review-app',
        "message":"Scaling app my-review-app to 0 container(s)…"
      });
      expect(loggerOkStub.firstCall.args[0]).to.deep.equal({
        "event": "review-app-manager",
        "app": 'my-review-app',
        "message":"App my-review-app scaled successfully"
      });
    });

    it('should resolve even when a scaling operation is marked as `error`', async () => {
      // given
      const loggerErrorStub = sinon.stub(logger, 'error');
      const scope = nock(scalingoApiUrl)
        .post(`/v1/apps/${app.name}/scale`)
        .reply(202, {}, {
          "Location": `${scalingoApiUrl}/v1/${app.name}/operations/operation-id`
        })
        .get(`/v1/${app.name}/operations/operation-id`)
        .reply(200, {
          "operation": {
            "status": "error",
            "error": "container web-1 failed to scale"
          }
        });

      const reviewAppClient = new ReviewAppClient(scalingoToken, scalingoApiUrl);

      // when
      await reviewAppClient.scale(app, formation);

      // then
      expect(loggerErrorStub.calledOnce).to.be.true;
      expect(loggerErrorStub.firstCall.args[0]).to.deep.equal({
        "event": "review-app-manager",
        "app": app.name,
        "message":"container web-1 failed to scale"
      });
      scope.isDone();
    });

    it('should check the scaling operation status up to X times before logging an error', async () => {
      // given
      const loggerErrorStub = sinon.stub(logger, 'error');
      const scope = nock(scalingoApiUrl)
        .post(`/v1/apps/${app.name}/scale`)
        .reply(202, {}, {
          "Location": `${scalingoApiUrl}/v1/${app.name}/operations/operation-id`
        })
        .get(`/v1/${app.name}/operations/operation-id`)
        .times(4)
        .reply(200, {
          "operation": {
            "status": "pending",
          }
        });

      const reviewAppClient = new ReviewAppClient(scalingoToken, scalingoApiUrl, {
        pollTimeInterval: 10,
        pollMaxAttempts: 3
      });

      // when
      await reviewAppClient.scale(app, formation);

      // then
      scope.isDone();
      expect(loggerErrorStub.calledOnce).to.be.true;
      expect(loggerErrorStub.firstCall.args[0]).to.deep.equal({
        "event": "review-app-manager",
        "app": app.name,
        "message":"Exceeded max attempts"
      });
    });

    it('should ignore error when the scaling dont change anything', async () => {
      // given
      const loggerInfoStub = sinon.stub(logger, 'info');
      const loggerWarnStub = sinon.stub(logger, 'warn');
      const scope = nock(scalingoApiUrl)
        .post(`/v1/apps/${app.name}/scale`)
        .reply(400, { error: 'no change in containers formation' });

      const reviewAppClient = new ReviewAppClient(scalingoToken, scalingoApiUrl);

      // when
      await reviewAppClient.scale(app, formation);

      // then
      expect(loggerInfoStub.calledOnce).to.be.true;
      expect(loggerInfoStub.firstCall.args[0]).to.deep.equal({
        "event": "review-app-manager",
        "app": 'my-review-app',
        "message":"Scaling app my-review-app to 0 container(s)…"
      });
      expect(loggerWarnStub.calledOnce).to.be.true;
      expect(loggerWarnStub.firstCall.args[0]).to.deep.equal({
        "event": "review-app-manager",
        "app": 'my-review-app',
        "message":"App my-review-app not scaled due to unchanged formation."
      });
      scope.isDone();
    });

    it('should ignore 422 error', async () => {
      // given
      const loggerInfoStub = sinon.stub(logger, 'info');
      const loggerWarnStub = sinon.stub(logger, 'warn');
      const scope = nock(scalingoApiUrl)
        .post(`/v1/apps/${app.name}/scale`)
        .reply(422, { errors: { app: [ 'is booting' ] } });

      const reviewAppClient = new ReviewAppClient(scalingoToken, scalingoApiUrl);

      // when
      await reviewAppClient.scale(app, formation);

      // then
      expect(loggerInfoStub.calledOnce).to.be.true;
      expect(loggerInfoStub.firstCall.args[0]).to.deep.equal({
        "event": "review-app-manager",
        "app": 'my-review-app',
        "message":"Scaling app my-review-app to 0 container(s)…"
      });
      expect(loggerWarnStub.calledOnce).to.be.true;
      expect(loggerWarnStub.firstCall.args[0].event).to.equals("review-app-manager");
      expect(loggerWarnStub.firstCall.args[0].app).to.equals("my-review-app");
      expect(loggerWarnStub.firstCall.args[0].message.status).to.equals(422);

      scope.isDone();
    });

    it('should log and not rethrow error in other cases', async () => {
      // given
      const loggerInfoStub = sinon.stub(logger, 'info');
      const loggerErrorStub = sinon.stub(logger, 'error');
      const scope = nock(scalingoApiUrl)
        .post(`/v1/apps/${app.name}/scale`)
        .reply(404, { error: 'oskour' });

      const reviewAppClient = new ReviewAppClient(scalingoToken, scalingoApiUrl);

      // when
      await reviewAppClient.scale(app, formation);

      // then
      expect(loggerInfoStub.calledOnce).to.be.true;
      expect(loggerInfoStub.firstCall.args[0]).to.deep.equal({
        "event": "review-app-manager",
        "app": 'my-review-app',
        "message":"Scaling app my-review-app to 0 container(s)…"
      });
      expect(loggerErrorStub.calledOnce).to.be.true;
      expect(loggerErrorStub.firstCall.args[0].event).to.equals("review-app-manager");
      expect(loggerErrorStub.firstCall.args[0].app).to.equals("my-review-app");
      expect(loggerErrorStub.firstCall.args[0].message.status).to.equals(404);
      scope.isDone();
    });
  });

  describe('#stopAllReviewApps()', () => {

    it('should scale down all review apps in status `new` or `running` that are not ignored', async () => {
      // given
      const scope = nock(scalingoApiUrl)
        .get('/v1/apps')
        .reply(200, {
          "apps": [
            {
              "name": "new-app-review-pr-1",
              "status": "new",
            }, {
              "name": "running-app-review-pr-2",
              "status" : "running",
            }, {
              "name": "stopped-app-review-pr-3",
              "status": "stopped",
            }, {
              "name": "not-review-app",
              "status": "running",
            }, {
              "name": "not-review-app",
              "status": "running",
            },
          ]
        })
        .post('/v1/apps/new-app-review-pr-1/scale')
        .reply(202, {}, {
          "Location": `${scalingoApiUrl}/v1/new-app-review-pr-1/operations/op-1`
        })
        .get(`/v1/new-app-review-pr-1/operations/op-1`)
        .reply(200, {
          "operation": {
            "status": "done",
          }
        })
        .post('/v1/apps/running-app-review-pr-2/scale')
        .reply(202, {}, {
          "Location": `${scalingoApiUrl}/v1/running-app-review-pr-2/operations/op-2`
        })
        .get(`/v1/running-app-review-pr-2/operations/op-2`)
        .reply(200, {
          "operation": {
            "status": "done",
          }
        });

      const reviewAppClient = new ReviewAppClient(scalingoToken, scalingoApiUrl);

      // when
      await reviewAppClient.stopAllReviewApps();

      // then
      scope.isDone();
    });

    it('should not scale down ignored review apps', async () => {
      // given
      const scope = nock(scalingoApiUrl)
        .get('/v1/apps')
        .reply(200, {
          "apps": [
            {
              "name": "ignored-review-pr-1",
              "status": "new",
            },
          ]
        });


      const reviewAppClient = new ReviewAppClient(scalingoToken, scalingoApiUrl, { ignoredReviewApps: ['ignored-review-pr-1']});

      // when
      await reviewAppClient.stopAllReviewApps();

      // then
      scope.isDone();
    });
  });

  describe('#restartAllReviewApps()', () => {

    it('should scale down up review apps in status `new` or `running` that are not ignored', async () => {
      // given
      const scope = nock(scalingoApiUrl)
        .get('/v1/apps')
        .reply(200, {
          "apps": [
            {
              "name": "stopped-app-review-pr-1",
              "status": "stopped",
            }, {
              "name": "crashed-app-review-pr-2",
              "status" : "crashed",
            }]
        })
        .post('/v1/apps/stopped-app-review-pr-1/scale')
        .reply(202, {}, {
          "Location": `${scalingoApiUrl}/v1/stopped-app-review-pr-1/operations/op-1`
        })
        .get(`/v1/stopped-app-review-pr-1/operations/op-1`)
        .reply(200, {
          "operation": {
            "status": "done",
          }
        })
        .post('/v1/apps/crashed-app-review-pr-2/scale')
        .reply(202, {}, {
          "Location": `${scalingoApiUrl}/v1/crashed-app-review-pr-2/operations/op-2`
        })
        .get(`/v1/crashed-app-review-pr-2/operations/op-2`)
        .reply(200, {
          "operation": {
            "status": "done",
          }
        });

      const reviewAppClient = new ReviewAppClient(scalingoToken, scalingoApiUrl, { reviewAppRestartDelay: 1 });

      // when
      await reviewAppClient.restartAllReviewApps();

      // then
      scope.isDone();
    });

    it('should not scale up ignored review apps', async () => {
      // given
      const scope = nock(scalingoApiUrl)
        .get('/v1/apps')
        .reply(200, {
          "apps": [
            {
              "name": "ignored-review-pr-1",
              "status": "new",
            },
          ]
        });


      const reviewAppClient = new ReviewAppClient(scalingoToken, scalingoApiUrl, { ignoredReviewApps: ['ignored-review-pr-1']});

      // when
      await reviewAppClient.restartAllReviewApps();

      // then
      scope.isDone();
    });
  });
});
