const scalingo = require('scalingo');

class ReviewAppClient {

  // Params
  _scalingoToken = null;
  _scalingoApiUrl = null;
  _ignoredReviewApps = null;

  // Internals
  _client = null;

  constructor(scalingToken, scalingoApiUrl, ignoredReviewApps = []) {
    this._scalingoToken = scalingToken;
    this._scalingoApiUrl = scalingoApiUrl;
    this._ignoredReviewApps = ignoredReviewApps;
  }

  async getClient() {
    if (!this._client) {
      this._client = await scalingo.clientFromToken(this._scalingoToken, { apiUrl: this._scalingoApiUrl });
    }
    return this._client;
  }

  async scale(app, formation) {
    const scalingoClient = await this.getClient();
    console.debug(`Scaling app ${app.name} to ${formation[0].amount} container(s)…`);
    try {
      await scalingoClient.Containers.scale(app.name, formation);
      console.log(`App ${app.name} scaled successfully`);
    } catch (err) {
      if (err._data && err._data.error === 'no change in containers formation') {
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

}

module.exports = ReviewAppClient;
