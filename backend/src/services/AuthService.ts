import { TenantRepository } from '../repositories/TenantRepository';
import { UserRepository } from '../repositories/UserRepository';
import { RoleRepository } from '../repositories/RoleRepository';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository';
import { PackageRepository } from '../repositories/PackageRepository';
import { generateId, IdPrefix } from '../utils/idGenerator';
import { AppError } from '../utils/AppError';
import { auth } from '../config/firebase';

const tenantRepo = new TenantRepository();
const userRepo = new UserRepository();
const roleRepo = new RoleRepository();
const subRepo = new SubscriptionRepository();
const packageRepo = new PackageRepository();

export class AuthService {
  async register(
    firebaseToken: string,
    businessName: string,
    name: string,
    email: string,
    phone: string,
    address: string,
    city: string
  ) {
    // 1. Verify token to ensure user is authenticated in Firebase
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(firebaseToken);
    } catch (e) {
      throw new AppError('Invalid Firebase token', 'UNAUTHORIZED', 401);
    }
    const firebaseUid = decodedToken.uid;
    const authEmail = decodedToken.email;

    if (email !== authEmail) {
      throw new AppError('Email does not match authentication token', 'VALIDATION_ERROR', 400);
    }

    // 2. Check if user already exists
    const existingUser = await userRepo.findByFirebaseUid(firebaseUid);
    if (existingUser) {
      throw new AppError('User already registered', 'USER_EXISTS', 400);
    }

    // 3. Find Starter package
    const starterPackage = await packageRepo.findByName('Starter');
    if (!starterPackage) {
      throw new AppError('System error: Starter package not found', 'INTERNAL_SERVER_ERROR', 500);
    }

    const tenantId = generateId(IdPrefix.TENANT);
    const userId = generateId(IdPrefix.USER);

    // 4. Create Tenant
    await tenantRepo.create(tenantId, {
      businessName,
      ownerUserId: userId,
      email,
      phone,
      address,
      city,
      profileStatus: 'PENDING',
      accountStatus: 'ACTIVE',
      createdBy: userId,
      updatedBy: userId
    });

    // 5. Create Default Owner Role for this tenant
    const roleId = generateId(IdPrefix.ROLE);
    await roleRepo.create(roleId, {
      tenantId,
      name: 'Owner',
      roleType: 'SYSTEM',
      permissions: [], // In a full implementation, map all permissions
      createdBy: userId,
      updatedBy: userId
    });

    // 6. Create User
    const user = await userRepo.create(userId, {
      firebaseUid,
      tenantId,
      name,
      email,
      roleId,
      userType: 'OWNER',
      status: 'ACTIVE',
      createdBy: userId,
      updatedBy: userId
    });

    // 7. Create Trial Subscription
    const subId = generateId(IdPrefix.SUBSCRIPTION);
    const now = new Date();
    const trialEndAt = new Date();
    trialEndAt.setDate(now.getDate() + (starterPackage.trialDays || 14));

    await subRepo.create(subId, {
      tenantId,
      packageId: starterPackage.id,
      status: 'TRIAL',
      trialStartAt: now,
      trialEndAt: trialEndAt,
      createdBy: userId,
      updatedBy: userId
    });

    return {
      tenantId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        userType: user.userType
      }
    };
  }

  async login(firebaseToken: string) {
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(firebaseToken);
    } catch (e) {
      throw new AppError('Invalid Firebase token', 'UNAUTHORIZED', 401);
    }
    const firebaseUid = decodedToken.uid;

    const user = await userRepo.findByFirebaseUid(firebaseUid);
    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }
    
    if (user.status !== 'ACTIVE') {
      throw new AppError(`User account is ${user.status}`, 'FORBIDDEN', 403);
    }

    // Admin users don't have a normal Tenant or Subscription
    if (user.userType === 'SAAS_ADMIN') {
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roleId: user.roleId,
          userType: user.userType,
          tenantId: user.tenantId
        },
        role: 'SAAS_ADMIN'
      };
    }

    const tenant = await tenantRepo.findById(user.tenantId);
    if (!tenant) {
      throw new AppError('Tenant not found', 'TENANT_NOT_FOUND', 404);
    }

    if (tenant.accountStatus !== 'ACTIVE') {
      throw new AppError(`Tenant account is ${tenant.accountStatus}`, 'FORBIDDEN', 403);
    }

    // Check subscription status
    const subs = await subRepo.findByQuery('tenantId', '==', tenant.id);
    const activeSub = subs.find(s => s.status === 'ACTIVE' || s.status === 'TRIAL');
    
    if (!activeSub) {
      throw new AppError('No active subscription found', 'PAYMENT_REQUIRED', 402);
    }

    // Convert Firestore Timestamp to Date for comparison if necessary
    const trialEndAt = activeSub.trialEndAt.toDate ? activeSub.trialEndAt.toDate() : new Date(activeSub.trialEndAt);
    if (activeSub.status === 'TRIAL' && new Date() > trialEndAt) {
      // Logic to transition to EXPIRED could go here in a background job or middleware
      throw new AppError('Trial expired', 'PAYMENT_REQUIRED', 402);
    }

    // Fetch Role Permissions
    let permissions: string[] = [];
    if (user.roleId) {
      const role = await roleRepo.findById(user.roleId);
      if (role && role.permissions) {
        permissions = role.permissions;
      }
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        userType: user.userType,
        tenantId: user.tenantId,
        permissions
      },
      tenant: {
        id: tenant.id,
        businessName: tenant.businessName,
        profileStatus: tenant.profileStatus
      },
      subscription: activeSub
    };
  }
  async googleLogin(firebaseToken: string) {
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(firebaseToken);
    } catch (e) {
      throw new AppError('Invalid Firebase token', 'UNAUTHORIZED', 401);
    }
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email || '';
    const name = decodedToken.name || email.split('@')[0];

    const existingUser = await userRepo.findByFirebaseUid(firebaseUid);
    
    if (existingUser) {
      // User exists, route to standard login response
      return this.login(firebaseToken);
    }

    // User does not exist, perform Google Registration Flow
    const starterPackage = await packageRepo.findByName('Starter');
    if (!starterPackage) {
      throw new AppError('System error: Starter package not found', 'INTERNAL_SERVER_ERROR', 500);
    }

    const tenantId = generateId(IdPrefix.TENANT);
    const userId = generateId(IdPrefix.USER);
    const businessName = `${name}'s Business`;

    await tenantRepo.create(tenantId, {
      businessName,
      ownerUserId: userId,
      email,
      phone: '',
      address: '',
      city: '',
      profileStatus: 'INCOMPLETE',
      accountStatus: 'ACTIVE',
      createdBy: userId,
      updatedBy: userId
    });

    const roleId = generateId(IdPrefix.ROLE);
    await roleRepo.create(roleId, {
      tenantId,
      name: 'Owner',
      roleType: 'SYSTEM',
      permissions: [],
      createdBy: userId,
      updatedBy: userId
    });

    const user = await userRepo.create(userId, {
      firebaseUid,
      tenantId,
      name,
      email,
      roleId,
      userType: 'OWNER',
      status: 'ACTIVE',
      createdBy: userId,
      updatedBy: userId
    });

    const subId = generateId(IdPrefix.SUBSCRIPTION);
    const now = new Date();
    const trialEndAt = new Date();
    trialEndAt.setDate(now.getDate() + (starterPackage.trialDays || 14));

    const activeSub = await subRepo.create(subId, {
      tenantId,
      packageId: starterPackage.id,
      status: 'TRIAL',
      trialStartAt: now,
      trialEndAt: trialEndAt,
      createdBy: userId,
      updatedBy: userId
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        userType: user.userType,
        tenantId: user.tenantId
      },
      tenant: {
        id: tenantId,
        businessName,
        profileStatus: 'INCOMPLETE'
      },
      subscription: activeSub
    };
  }
}
