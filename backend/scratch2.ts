import { UserRepository } from './src/repositories/UserRepository';
import { TenantRepository } from './src/repositories/TenantRepository';
import { SubscriptionRepository } from './src/repositories/SubscriptionRepository';

async function testLoginLogic() {
  const firebaseUid = '7H5vfAUisscQ9kAjRD8LcmlRE7D2';
  console.log('Testing for firebaseUid:', firebaseUid);

  try {
    const userRepo = new UserRepository();
    const tenantRepo = new TenantRepository();
    const subRepo = new SubscriptionRepository();

    const user = await userRepo.findByFirebaseUid(firebaseUid);
    if (!user) {
      console.log('User not found!');
      process.exit(1);
    }
    console.log('User found:', user.id);

    const tenant = await tenantRepo.findById(user.tenantId, user.tenantId);
    if (!tenant) {
      console.log('Tenant not found for ID:', user.tenantId);
      process.exit(1);
    }
    console.log('Tenant found:', tenant.id);

    const subs = await subRepo.findByQuery('tenantId', '==', tenant.id, tenant.id);
    const activeSub = subs.find(s => s.status === 'ACTIVE' || s.status === 'TRIAL');
    if (!activeSub) {
      console.log('No active subscription found!');
      process.exit(1);
    }
    console.log('Subscription found:', activeSub.id);

    console.log('All DB checks passed!');
    process.exit(0);
  } catch (error) {
    console.error('Error during checks:', error);
    process.exit(1);
  }
}

testLoginLogic();
