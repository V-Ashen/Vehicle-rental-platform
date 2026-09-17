import { SubscriptionRepository } from './src/repositories/SubscriptionRepository';

async function checkSubs() {
  try {
    const subRepo = new SubscriptionRepository();
    // Get ALL subs
    const subs = await subRepo.findByQuery('status', 'in', ['TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED']);
    console.log(`Found ${subs.length} subscriptions in DB.`);
    subs.forEach(s => console.log(s));
    process.exit(0);
  } catch (error) {
    console.error('Error fetching subs:', error);
    process.exit(1);
  }
}

checkSubs();
