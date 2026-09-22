import { Request, Response } from 'express';
import { db, auth } from '../config/firebase';
import { AppError } from '../utils/AppError';
import { generateId, IdPrefix } from '../utils/idGenerator';

export class OwnerStaffController {
  async list(req: Request, res: Response) {
    const tenantId = (req as any).ownerUser.tenantId;
    // Assuming staff is grouped in the 'users' collection with userType: 'STAFF' and tenantId
    const snapshot = await db.collection('users')
      .where('tenantId', '==', tenantId)
      .where('userType', '==', 'STAFF')
      .get();
    const staff = snapshot.docs.map(doc => doc.data());
    res.status(200).json({ success: true, data: staff });
  }

  async create(req: Request, res: Response) {
    const tenantId = (req as any).ownerUser.tenantId;
    const adminId = (req as any).ownerUser.id;
    const { fullName, email, password, roleId } = req.body;

    if (!fullName || !email || !password || !roleId) {
      throw new AppError('Missing required fields', 'VALIDATION_ERROR', 400);
    }

    // Role check
    const roleDoc = await db.collection('roles').doc(roleId).get();
    if (!roleDoc.exists || roleDoc.data()?.tenantId !== tenantId) {
      throw new AppError('Invalid roleId', 'VALIDATION_ERROR', 400);
    }

    let firebaseUid = '';
    try {
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: fullName,
      });
      firebaseUid = userRecord.uid;
    } catch (error: any) {
      throw new AppError(`Failed to create auth user: ${error.message}`, 'INTERNAL_SERVER_ERROR', 500);
    }

    const userId = generateId(IdPrefix.USER);
    const staffData = {
      id: userId,
      firebaseUid,
      tenantId,
      fullName,
      email,
      roleId,
      userType: 'STAFF',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: adminId,
      updatedBy: adminId
    };

    await db.collection('users').doc(userId).set(staffData);
    res.status(201).json({ success: true, data: staffData });
  }

  async update(req: Request, res: Response) {
    const tenantId = (req as any).ownerUser.tenantId;
    const staffId = req.params.id;
    const { fullName, roleId, status } = req.body;

    const staffRef = db.collection('users').doc(staffId);
    const doc = await staffRef.get();
    if (!doc.exists || doc.data()?.tenantId !== tenantId) {
      throw new AppError('Staff not found', 'NOT_FOUND', 404);
    }

    await staffRef.update({
      fullName,
      roleId,
      status,
      updatedAt: new Date(),
      updatedBy: (req as any).ownerUser.id
    });

    res.status(200).json({ success: true });
  }
}
