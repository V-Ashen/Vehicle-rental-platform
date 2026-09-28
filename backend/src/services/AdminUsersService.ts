import { db, auth } from '../config/firebase';
import { AppError } from '../utils/AppError';
import { generateId, IdPrefix } from '../utils/idGenerator';

export class AdminUsersService {
  async getAllSaaSUsers() {
    const snapshot = await db.collection('users')
      .where('userType', '==', 'SAAS_ADMIN')
      .where('status', '!=', 'DELETED')
      .get();
      
    return snapshot.docs.map(doc => doc.data());
  }

  async inviteSaaSUser(data: { name: string; email: string; saasRole: string }, invitedBy: string) {
    const { name, email, saasRole } = data;

    // Check if user already exists
    const existing = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!existing.empty) {
      throw new AppError('User with this email already exists', 'CONFLICT', 409);
    }

    // Create Firebase Auth user
    let firebaseUid;
    try {
      const userRecord = await auth.createUser({
        email,
        displayName: name,
        password: 'Welcome123!', // Standard temporary password
      });
      firebaseUid = userRecord.uid;
    } catch (e: any) {
      throw new AppError(`Failed to create Firebase user: ${e.message}`, 'INTERNAL_ERROR', 500);
    }

    const userId = generateId(IdPrefix.SYSTEM); // 'SYS-...' or similar, maybe USR-
    const userRef = db.collection('users').doc(userId);

    const userData = {
      id: userId,
      firebaseUid,
      tenantId: 'SYSTEM',
      name,
      email,
      roleId: 'SYSTEM_ADMIN', // Placeholder for DB schema compatibility
      userType: 'SAAS_ADMIN',
      saasRole,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: invitedBy,
      updatedBy: invitedBy
    };

    await userRef.set(userData);
    
    // In a real system, send a password reset email here
    // await auth.generatePasswordResetLink(email);

    return userData;
  }
}
