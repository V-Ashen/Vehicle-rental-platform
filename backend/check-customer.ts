import { db } from './src/config/firebase';

async function checkCustomer() {
  const doc = await db.collection('customers').doc('CUS-NQXZD9').get();
  console.log(doc.data());
  process.exit(0);
}

checkCustomer();
