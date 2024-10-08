import * as dotenv from 'dotenv';
dotenv.config({ path: `${__dirname}/.env` });

import { ReviewAppManager } from '../index.js'

async function main() {

  const scalingoToken = process.env.SCALINGO_TOKEN;
  const scalingoApiUrl = process.env.SCALINGO_API_URL;
  const stopCronTime = process.env.STOP_CRON_TIME;
  const restartCronTime = process.env.RESTART_CRON_TIME;
  const ignoredReviewApps = process.env.IGNORED_REVIEW_APPS.split(',');
  const timeZone = process.env.TIME_ZONE;

  const reviewAppManager = new ReviewAppManager(scalingoToken, scalingoApiUrl, {
    stopCronTime,
    restartCronTime,
    ignoredReviewApps,
    timeZone
  });

  return reviewAppManager.startEcoMode();
}

main().then(() => console.log('success'));
