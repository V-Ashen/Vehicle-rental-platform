import { db } from './src/config/firebase';

async function deleteUnwantedPayments() {
  const paymentIds = [
    'PAY-RZ1OOA',
    'PAY-XI5XVQ',
    'PAY-VZ7W99',
    'PAY-4KK21U',
    'PAY-HMXZ5V',
    'PAY-G6J2YR',
    'PAY-UGGHPB',
    'PAY-0HPMSH'
  ];

  console.log(`Attempting to delete ${paymentIds.length} payments...`);
  
  const batch = db.batch();
  for (const id of paymentIds) {
    const ref = db.collection('payments').doc(id);
    batch.delete(ref);
  }

  await batch.commit();
  console.log('Successfully deleted the unwanted payments!');
  process.exit(0);
}

deleteUnwantedPayments().catch(console.error);
