const { expect, nock } = require('./testing');
const ReviewAppClient = require('../lib/ReviewAppClient');

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
  });

  describe('#scale()', () => {

    const app = { name: 'my-review-app' };
    const formation = [{ name: 'web', size: 'S', amount: 0 }];

    it('should call Scalingo API through the Scalingo client `Containers` services', async () => {
      // given
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
    });

    it('should await for scaling operation to be `done` and poll-check it until it is', async () => {
      // given
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
    });

    it('should resolve even when a scaling operation is marked as `error`', () => {
      // given
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
      const promise = reviewAppClient.scale(app, formation);

      // then
      return expect(promise).to.be.fulfilled;
    });

    it('should check the scaling operation status up to X times before logging an error', async () => {
      // given
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

      const reviewAppClient = new ReviewAppClient(scalingoToken, scalingoApiUrl);

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