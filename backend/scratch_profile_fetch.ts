import { db } from './src/config/firebase';

async function testFetch() {
  const tenantsSnapshot = await db.collection('tenants').limit(1).get();
  if (tenantsSnapshot.empty) {
    console.log("No tenants found");
    return;
  }
  const tenant = tenantsSnapshot.docs[0].data();
  console.log("Tenant Data:", JSON.stringify(tenant, null, 2));
}

testFetch().catch(console.error);
