const scalingo = require('scalingo');

const ONE_HOUR = 60 * 1000;

class ReviewAppClient {

  // Params
  _scalingoToken = null;
  _scalingoApiUrl = null;
  _ignoredReviewApps = null;
  _pollTimeInterval = null;
  _pollMaxAttempts = null;

  // Internals
  _client = null;
  _expirationDate = null;

  _hasNullOrInvalidClient() {
    return !this._client
      || !this._expirationDate
      || ((new Date()).getTime() > this._expirationDate.getTime());
  }

  constructor(scalingToken, scalingoApiUrl, ignoredReviewApps = [], pollTimeInterval, pollMaxAttempts) {
    this._scalingoToken = scalingToken;
    this._scalingoApiUrl = scalingoApiUrl;
    this._ignoredReviewApps = ignoredReviewApps;
    this._pollTimeInterval = pollTimeInterval;
    this._pollMaxAttempts = pollMaxAttempts;
  }

  async getClient() {
    if (this._hasNullOrInvalidClient()) {
      this._client = await scalingo.clientFromToken(this._scalingoToken, { apiUrl: this._scalingoApiUrl });
      this._expirationDate = new Date((new Date()).getTime() + ONE_HOUR);
    }
    return this._client;
  }

  async scale(app, formation) {
    const scalingoClient = await this.getClient();
    console.debug(`Scaling app ${app.name} to ${formation[0].amount} container(s)…`);

    try {
      const { operation } = await scalingoClient.Containers.scale(app.name, formation);

      await this.pollOperationStatus(operation);
      console.log(`App ${app.name} scaled successfully`);
    } catch (err) {
      if ((err._data && err._data.error === 'no change in containers formation') || err === 'no change in containers formation') {
        console.log(`App ${app.name} not scaled due to unchanged formation.`);
      } else {
        console.error(err);
      }
    }
  }

  async stopAllReviewApps() {
    const scalingoClient = await this.getClient();
    const apps = await scalingoClient.Apps.all();
    const activeReviewApps = apps
      .filter((app) => app.name.includes('-review-pr'))
      .filter((app) => !this._ignoredReviewApps.includes(app.name))
      .filter((app) => app.status === 'new' || app.status === 'running');
    return Promise.all(activeReviewApps.map(async (app) => {
      await this.scale(app, [{ name: 'web', size: 'S', amount: 0 }])
    }));
  }

  async restartAllReviewApps() {
    const scalingoClient = await this.getClient();
    const apps = await scalingoClient.Apps.all();
    const activeReviewApps = apps
      .filter((app) => app.name.includes('-review-pr'))
      .filter((app) => !this._ignoredReviewApps.includes(app.name));
    return Promise.all(activeReviewApps.map(async (app) => {
      return this.scale(app, [{ name: 'web', size: 'S', amount: 1 }]);
    }));
  }

  async pollOperationStatus(operation) {
    let attempts = 0;

    const executePoll = async (resolve, reject) => {
      attempts++;
      await operation.refresh();

      if (operation.status === 'done') {
        return resolve();
      } else if (operation.status === 'error') {
        return reject(new Error(operation.error));
      } else if (attempts >= this._pollMaxAttempts) {
        return reject(new Error('Exceeded max attempts'));
      } else {
        setTimeout(executePoll, this._pollTimeInterval, resolve, reject);
      }
    };

    return new Promise(executePoll);
  };

}

module.exports = ReviewAppClient;
