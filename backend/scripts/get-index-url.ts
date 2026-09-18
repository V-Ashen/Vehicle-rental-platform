import { db } from '../src/config/firebase';

async function getIndexUrl() {
  try {
    const testQuery = db.collection('vehicles')
      .where('tenantId', '==', 'test-tenant')
      .orderBy('createdAt', 'desc');
      
    await testQuery.get();
    console.log('Query succeeded! No index needed?!');
  } catch (error: any) {
    if (error.message && error.message.includes('The query requires an index.')) {
      const url = error.message.split('https://console.firebase.google.com')[1];
      console.log('Index URL: https://console.firebase.google.com' + url);
    } else {
      console.log('Other error:', error);
    }
  }
}

getIndexUrl().then(() => process.exit(0));
