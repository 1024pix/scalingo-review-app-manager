import * as scalingo from 'scalingo';
import { logger } from './Logger.js';

const ONE_HOUR = 60 * 1000;

class ReviewAppClient {

  // Params
  _scalingoToken = null;
  _scalingoApiUrl = null;
  _ignoredReviewApps = null;
  _pollTimeInterval = null;
  _pollMaxAttempts = null;
  _reviewAppRestartDelay = null;

  // Internals
  _client = null;
  _expirationDate = null;

  constructor(scalingoToken, scalingoApiUrl, options = {}) {
    this._scalingoToken = scalingoToken;
    this._scalingoApiUrl = scalingoApiUrl;

    this._ignoredReviewApps = options.ignoredReviewApps || [];
    this._pollTimeInterval = options.pollTimeInterval || 1000;
    this._pollMaxAttempts = options.pollMaxAttempts || 10;
    this._reviewAppRestartDelay = options.reviewAppRestartDelay || 3000;
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
        logger.error({ event: 'review-app-manager', message: operation.error });
        return resolve();
      }
      if (this._pollMaxAttempts && attempts >= this._pollMaxAttempts) {
        logger.error({ event: 'review-app-manager', message: 'Exceeded max attempts' });
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
    logger.info({ event: 'review-app-manager', app: app.name, message: `Scaling app ${app.name} to ${formation[0].amount} container(s)…` });

    try {
      const { operation } = await scalingoClient.Containers.scale(app.name, formation);
      await this._pollOperationStatus(operation);
      logger.ok({ event: 'review-app-manager', app: app.name, message: `App ${app.name} scaled successfully` });
    } catch (err) {
      if ((err._data && err._data.error === 'no change in containers formation') || err === 'no change in containers formation') {
        logger.warn({ event: 'review-app-manager', app: app.name, message: `App ${app.name} not scaled due to unchanged formation.` });
      } else if (err.status === 422) {
        logger.warn({ event: 'review-app-manager', app: app.name, message: err });
      } else {
        logger.error({ event: 'review-app-manager', app: app.name, message: err });
        throw err;
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
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const result = [];
    for (const app of activeReviewApps) {
      result.push(this.scale(app, [{name: 'web', size: 'S', amount: 1}]));
      await delay(this._reviewAppRestartDelay);
    }
    return result;
  }
}

export { ReviewAppClient };
