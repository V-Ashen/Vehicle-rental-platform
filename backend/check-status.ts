import { db } from './src/config/firebase';

async function checkStatus() {
  const tenants = await db.collection('tenants').get();
  console.log('Tenants:');
  tenants.forEach(t => console.log(t.id, t.data().businessName, t.data().accountStatus));

  const subs = await db.collection('subscriptions').get();
  console.log('Subscriptions:');
  subs.forEach(s => console.log(s.id, s.data().tenantId, s.data().status, s.data().trialEndAt?.toDate?.()));

  process.exit(0);
}

checkStatus();
