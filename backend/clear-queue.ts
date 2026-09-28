import { db } from './src/config/firebase';

async function clearQueue() {
  console.log('Clearing queued notifications...');
  const snapshot = await db.collection('notifications').where('status', '==', 'QUEUED').get();
  
  if (snapshot.empty) {
    console.log('No queued notifications found.');
    process.exit(0);
  }

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      status: 'CANCELLED',
      errorMessage: 'Cancelled due to Resend monthly quota exceeded',
      updatedAt: new Date(),
      updatedBy: 'SYSTEM_ADMIN'
    });
  });

  await batch.commit();
  console.log(`Successfully cancelled ${snapshot.size} queued notifications.`);
  process.exit(0);
}

clearQueue();
