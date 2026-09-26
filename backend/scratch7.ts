import { CronService } from './src/services/CronService';
import { db } from './src/config/firebase';

async function runCron() {
  console.log("Running CronService manually...");
  const cron = new CronService();
  
  // First, check if there are any queued notifications
  const allNotifs = await db.collection('notifications').orderBy('createdAt', 'desc').limit(5).get();
  console.log(`Found ${allNotifs.size} recent notifications.`);
  console.log(allNotifs.docs.map(d => ({id: d.id, ...d.data()})));
  
  process.exit(0);
}

runCron().catch(console.error);
