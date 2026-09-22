import { CronService } from './src/services/CronService';

async function runCron() {
  const cronService = new CronService();
  console.log('Running processNotifications()...');
  const result = await cronService.processNotifications();
  console.log('Result:', result);
  process.exit(0);
}

runCron().catch(err => {
  console.error('Cron Error:', err);
  process.exit(1);
});
