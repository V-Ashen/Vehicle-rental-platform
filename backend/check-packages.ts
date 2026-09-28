import { db } from './src/config/firebase';

async function checkPackages() {
  const snapshot = await db.collection('packages').get();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`Package: ${data.name} (ID: ${doc.id})`);
    console.log(`Features: ${JSON.stringify(data.features, null, 2)}`);
    console.log('-------------------------');
  });
  process.exit(0);
}

checkPackages();
