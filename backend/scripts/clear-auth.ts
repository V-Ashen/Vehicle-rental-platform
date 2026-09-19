import { auth } from '../src/config/firebase';

async function clearAuth() {
  try {
    console.log('Fetching all users in Firebase Auth...');
    const listUsersResult = await auth.listUsers(1000);
    const uids = listUsersResult.users.map(user => user.uid);
    
    if (uids.length > 0) {
      console.log(`Deleting ${uids.length} users...`);
      await auth.deleteUsers(uids);
      console.log('✅ Successfully deleted all stuck users in Auth.');
    } else {
      console.log('No users found in Auth.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Failed to clear Auth:', error);
    process.exit(1);
  }
}

clearAuth();
