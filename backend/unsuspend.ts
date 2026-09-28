import { db } from './src/config/firebase';

async function unsuspend() {
  await db.collection('tenants').doc('TEN-RYMOQF').update({
    accountStatus: 'ACTIVE',
    profileStatus: 'APPROVED'
  });
  console.log('Unsuspended tenant TEN-RYMOQF');
  process.exit(0);
}

unsuspend();
