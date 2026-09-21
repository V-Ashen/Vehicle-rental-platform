import { Firestore } from '@google-cloud/firestore';
import dotenv from 'dotenv';
dotenv.config();

async function testDb(databaseId: string) {
  try {
    console.log(`Testing databaseId: ${databaseId}...`);
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    const db = new Firestore({
      projectId: serviceAccount.project_id,
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key
      },
      databaseId: databaseId
    });

    const docRef = db.collection('test').doc('test-doc');
    await docRef.set({ test: true });
    console.log(`✅ Successfully wrote to databaseId: ${databaseId}`);
  } catch (e: any) {
    console.error(`❌ Failed for databaseId: ${databaseId} - ${e.message}`);
  }
}

async function run() {
  await testDb('(default)');
  await testDb('default');
  process.exit(0);
}

run();
