require('dotenv').config();

const ReviewAppManager = require('../index').ReviewAppManager;

async function main() {

  const scalingoToken = process.env.SCALINGO_TOKEN;
  const scalingoApiUrl = process.env.SCALINGO_API_URL;
  const stopCronTime = process.env.STOP_CRON_TIME;
  const restartCronTime = process.env.RESTART_CRON_TIME;
  const ignoredReviewApps = process.env.IGNORED_REVIEW_APPS.split(',');

  const reviewAppManager = new ReviewAppManager(scalingoToken, scalingoApiUrl, { stopCronTime, restartCronTime, ignoredReviewApps });
  return reviewAppManager.startEcoMode();
}

main().then(() => console.log('success'));