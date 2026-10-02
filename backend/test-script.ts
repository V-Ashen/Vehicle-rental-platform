import { db } from './src/config/firebase';

async function run() {
  const rentals = await db.collection('rentals').where('status', '==', 'ON_RENT').get();
  let count = 0;
  for (const doc of rentals.docs) {
    await doc.ref.update({
      isOverdue: false,
      expectedReturnAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    });
    console.log('Fixed rental:', doc.id);
    count++;
  }
  console.log('Fixed count:', count);
  process.exit(0);
}

run().catch(console.error);
