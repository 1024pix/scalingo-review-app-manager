# Scalingo Review App Manager

Small and lightweight utility that automatically stop & restart your review apps on Scalingo each day.

## Basic Usage

**1/** Install the dependency.

```javascript
npm install scalingo-review-app-manager
```

**2/** Declare a new `ReviewAppManager` and run the CRON-based "Eco Mode".

```javascript
const ReviewAppManager = require('../index').ReviewAppManager;

const reviewAppManager = new ReviewAppManager('tk-us-DkjGg...', 'https://api.osc-fr1.scalingo.com');

reviewAppManager.startEcoMode().then(() => console.log('Eco Mode enabled.'));
```

## Advanced usage

### Custom stop & restart times

By default review apps will be shut down every week day at 7pm and will be restarted the day after (if it is a week day) at 8am.

You can customize the stop and restart times by passing `stopCronTime` and/or `restartCronTime` parameters (RegExp strings) to the ReviewAppManager constructor.

```javascript
const options = {
  stopCronTime: '0 0 22 * * 1-5',
  restartCronTime: '0 0 6 * * 1-5'
};
(new ReviewAppManager(scalingoToken, scalingoApiUrl, options)).startEcoMode();
```

### Ignoring some review apps

By default, all the review apps will be stopped and restarted according to stop & restart times.

You can ignore some review apps by passing `ignoredReviewApps` parameter (array of strings) to the ReviewAppManager constructor.

```javascript
const options = {
  ignoredReviewApps: ['my-app-review-pr1', 'my-app-review-pr3']
};
(new ReviewAppManager(scalingoToken, scalingoApiUrl, options)).startEcoMode();
```

### Status Poll 

The Scalingo API limits the numbers of applications scaling in the same time. 

To deal with this limit, a mechanism of polling by application scaling is set up.

By default, the scaling status of each application is checked every 1000ms with a maximum of 10 attempts. 
These values can be parameterized in the options object of the `ReviewAppManager` constructor : `pollTimeInterval` (number, in ms) and `pollMaxAttempts` (number).

```javascript
const options = {
  pollTimeInterval: 1000,
  pollMaxAttempts: 10
};
(new ReviewAppManager(scalingoToken, scalingoApiUrl, options)).startEcoMode();
```

## License

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

This software is released under the [AGPL-3.0](https://www.gnu.org/licenses/why-affero-gpl.en.html) license & supports modern environments.
