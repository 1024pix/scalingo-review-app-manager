# Scalingo Review App Manager

## Usage

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
