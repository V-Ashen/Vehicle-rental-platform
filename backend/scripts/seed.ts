import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import { generateId, IdPrefix } from '../src/utils/idGenerator';

dotenv.config();

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;
if (serviceAccountKey) {
  initializeApp({
    credential: cert(JSON.parse(serviceAccountKey)),
  });
} else {
  initializeApp();
}

const db = getFirestore();

const seedPackages = async () => {
  const packagesCollection = db.collection('packages');
  
  // Clean existing defaults (optional, but good for idempotency)
  const existing = await packagesCollection.get();
  for (const doc of existing.docs) {
    await doc.ref.delete();
  }

  const defaultPackages = [
    {
      name: 'Starter',
      monthlyPrice: 49,
      yearlyPrice: 490,
      trialDays: 14,
      maxVehicles: 10,
      maxUsers: 2,
      features: { basicReporting: true, support: 'email' }
    },
    {
      name: 'Growth',
      monthlyPrice: 99,
      yearlyPrice: 990,
      trialDays: 14,
      maxVehicles: 50,
      maxUsers: 5,
      features: { basicReporting: true, advancedReporting: true, support: 'priority' }
    },
    {
      name: 'Professional',
      monthlyPrice: 199,
      yearlyPrice: 1990,
      trialDays: 14,
      maxVehicles: 200,
      maxUsers: 15,
      features: { basicReporting: true, advancedReporting: true, apiAccess: true, support: '24/7' }
    },
    {
      name: 'Enterprise',
      monthlyPrice: 499,
      yearlyPrice: 4990,
      trialDays: 14,
      maxVehicles: 1000,
      maxUsers: 100,
      features: { allFeatures: true, customIntegrations: true, dedicatedManager: true }
    }
  ];

  for (const pkg of defaultPackages) {
    const id = generateId(IdPrefix.PACKAGE);
    const now = new Date();
    await packagesCollection.doc(id).set({
      ...pkg,
      id,
      createdAt: now,
      updatedAt: now,
      status: 'ACTIVE',
      createdBy: 'SYSTEM',
      updatedBy: 'SYSTEM'
    });
    console.log(`Seeded package: ${pkg.name} with ID: ${id}`);
  }

  console.log('✅ Seed completed successfully.');
};

seedPackages().catch(console.error).finally(() => process.exit(0));
