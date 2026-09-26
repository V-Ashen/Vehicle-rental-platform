import { db } from './src/config/firebase';

async function checkNotifications() {
  console.log('Checking recent notifications...');
  const snapshot = await db.collection('notifications')
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();
    
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log('-------------------------');
    console.log(`ID: ${doc.id}`);
    console.log(`Status: ${data.status}`);
    console.log(`Type: ${data.type}`);
    console.log(`Email: ${data.email || 'N/A'}`);
    console.log(`User ID: ${data.userId}`);
    if (data.errorMessage) {
      console.log(`Error: ${data.errorMessage}`);
    }
  });
  process.exit(0);
}

checkNotifications();
