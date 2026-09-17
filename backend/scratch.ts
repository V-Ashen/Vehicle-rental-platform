import { db } from './src/config/firebase';

async function checkUsers() {
  try {
    const snapshot = await db.collection('users').get();
    console.log(`Found ${snapshot.size} users in DB.`);
    snapshot.forEach(doc => {
      console.log(doc.id, '=>', doc.data());
    });
    process.exit(0);
  } catch (error) {
    console.error('Error fetching users:', error);
    process.exit(1);
  }
}

checkUsers();
