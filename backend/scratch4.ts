import { db } from './src/config/firebase';

async function checkNotifications() {
  const snapshot = await db.collection('notifications').orderBy('createdAt', 'desc').limit(10).get();
  console.log(`Found ${snapshot.docs.length} notifications:`);
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log({
      id: doc.id,
      type: data.type,
      userId: data.userId,
      email: data.email,
      status: data.status,
      errorMessage: data.errorMessage,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
    });
  });
  process.exit(0);
}

checkNotifications().catch(err => {
  console.error(err);
  process.exit(1);
});
