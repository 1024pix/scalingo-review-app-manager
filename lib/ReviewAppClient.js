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

  constructor(scalingoToken, scalingoApiUrl, options = {}) {
    this._scalingoToken = scalingoToken;
    this._scalingoApiUrl = scalingoApiUrl;

    this._ignoredReviewApps = options.ignoredReviewApps || [];
    this._pollTimeInterval = options.pollTimeInterval || 1000;
    this._pollMaxAttempts = options.pollMaxAttempts || 10;
  }

  /*
   * PRIVATE
   */

  _hasNullOrInvalidClient() {
    return !this._client
      || !this._expirationDate
      || ((new Date()).getTime() > this._expirationDate.getTime());
  }

  async _getClient() {
    if (this._hasNullOrInvalidClient()) {
      this._client = await scalingo.clientFromToken(this._scalingoToken, { apiUrl: this._scalingoApiUrl });
      this._expirationDate = new Date((new Date()).getTime() + ONE_HOUR);
    }
    return this._client;
  }

  async _pollOperationStatus(operation) {
    if (!operation) {
      return;
    }
    let attempts = 0;

    const executePoll = async (resolve) => {
      if (operation.status === 'done') {
        return resolve();
      }
      if (operation.status === 'error') {
        console.error(operation.error);
        return resolve();
      }
      if (this._pollMaxAttempts && attempts >= this._pollMaxAttempts) {
        console.error('Exceeded max attempts');
        return resolve();
      }

      await operation.refresh();
      attempts++;

      setTimeout(executePoll, this._pollTimeInterval, resolve);
    };

    return new Promise(executePoll);
  }

  async _getReviewsApps() {
    const scalingoClient = await this._getClient();
    const apps = await scalingoClient.Apps.all();
    return apps
      .filter((app) => app.name.includes('-review-pr'))
      .filter((app) => !this._ignoredReviewApps.includes(app.name));
  }

  /*
   * PUBLIC
   */

  async scale(app, formation) {
    const scalingoClient = await this._getClient();
    console.debug(`Scaling app ${app.name} to ${formation[0].amount} container(s)…`);

    try {
      const { operation } = await scalingoClient.Containers.scale(app.name, formation);
      await this._pollOperationStatus(operation);
      console.log(`App ${app.name} scaled successfully`);
    } catch (err) {
      if ((err._data && err._data.error === 'no change in containers formation') || err === 'no change in containers formation') {
        console.log(`App ${app.name} not scaled due to unchanged formation.`);
      } else {
        console.error(app.name, err);
      }
    }
  }

  async stopAllReviewApps() {
    const apps = await this._getReviewsApps();
    const activeReviewApps = apps.filter((app) => app.status === 'new' || app.status === 'running');
    return Promise.all(activeReviewApps.map(async (app) => {
      await this.scale(app, [{ name: 'web', size: 'S', amount: 0 }])
    }));
  }

  async restartAllReviewApps() {
    const activeReviewApps = await this._getReviewsApps();
    return Promise.all(activeReviewApps.map(async (app) => {
      return this.scale(app, [{ name: 'web', size: 'S', amount: 1 }]);
    }));
  }
}

module.exports = ReviewAppClient;
