import { auth, db } from '../src/config/firebase';

async function createSaaSAdmin() {
  const email = 'vihangaasen@gmail.com';
  const password = '123456';
  
  try {
    console.log('Creating SaaS Admin in Firebase Auth...');
    
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('User already exists in Auth. Updating password...');
      await auth.updateUser(userRecord.uid, { password });
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email,
          password,
          emailVerified: true,
        });
        console.log('Created new user in Auth.');
      } else {
        throw e;
      }
    }

    console.log('Creating SaaS Admin document in Firestore...');
    const now = new Date();
    
    // Create the user document in the users collection
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      firebaseUid: userRecord.uid,
      email: email,
      userType: 'SAAS_ADMIN',
      firstName: 'SaaS',
      lastName: 'Admin',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    });

    // Set custom claims for RBAC
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'SAAS_ADMIN'
    });

    console.log(`✅ Success! SaaS Admin account created.`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to create SaaS admin:', error);
    process.exit(1);
  }
}

createSaaSAdmin();
