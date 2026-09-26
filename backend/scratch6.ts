import { db } from './src/config/firebase';

async function checkDb() {
  console.log("Checking DB...");
  const users = await db.collection('users').where('email', '==', 'vihangaasen321@gmail.com').get();
  const user = users.docs[0].data();
  const tId = user.tenantId;
  console.log("Tenant ID:", tId);

  const subs = await db.collection('subscriptions').where('tenantId', '==', tId).get();
  console.log("Subscriptions:", subs.docs.map(d => ({id: d.id, ...d.data()})));

  const payments = await db.collection('payments').where('tenantId', '==', tId).orderBy('createdAt', 'desc').limit(5).get();
  console.log("Payments:", payments.docs.map(d => ({id: d.id, ...d.data()})));
  
  process.exit(0);
}

checkDb().catch(console.error);
