import { db } from './src/config/firebase';

async function checkSub() {
  const t = await db.collection('tenants').doc('TEN-RYMOQF').get();
  console.log(t.data());
  process.exit(0);
}

checkSub();
