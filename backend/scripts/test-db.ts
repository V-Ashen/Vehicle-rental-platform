import { db } from '../src/config/firebase';

async function test() {
  try {
    console.log('Testing Firestore...');
    const docRef = db.collection('test').doc('test-doc');
    await docRef.set({ test: true });
    console.log('Successfully wrote to Firestore!');
    
    // Also try listing collections
    const collections = await db.listCollections();
    console.log('Collections:', collections.map(c => c.id));
    
    process.exit(0);
  } catch (e: any) {
    console.error('Firestore Error:', e);
    process.exit(1);
  }
}
test();
