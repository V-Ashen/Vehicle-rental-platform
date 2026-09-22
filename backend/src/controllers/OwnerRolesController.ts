import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { AppError } from '../utils/AppError';
import { generateId, IdPrefix } from '../utils/idGenerator';

export class OwnerRolesController {
  async list(req: Request, res: Response) {
    const tenantId = (req as any).ownerUser.tenantId;
    const snapshot = await db.collection('roles')
      .where('tenantId', '==', tenantId)
      .where('status', '!=', 'INACTIVE')
      .get();
    const roles = snapshot.docs.map(doc => doc.data());
    res.status(200).json({ success: true, data: roles });
  }

  async create(req: Request, res: Response) {
    const tenantId = (req as any).ownerUser.tenantId;
    const userId = (req as any).ownerUser.id;
    const { name, permissions } = req.body;

    if (!name || !Array.isArray(permissions)) {
      throw new AppError('Invalid payload', 'VALIDATION_ERROR', 400);
    }

    const roleId = generateId(IdPrefix.ROLE || 'ROL-');
    const roleData = {
      id: roleId,
      tenantId,
      name,
      permissions,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      updatedBy: userId
    };

    await db.collection('roles').doc(roleId).set(roleData);
    res.status(201).json({ success: true, data: roleData });
  }

  async update(req: Request, res: Response) {
    const tenantId = (req as any).ownerUser.tenantId;
    const roleId = req.params.id as string;
    const { name, permissions } = req.body;

    const roleRef = db.collection('roles').doc(roleId);
    const doc = await roleRef.get();
    if (!doc.exists || doc.data()?.tenantId !== tenantId) {
      throw new AppError('Role not found', 'NOT_FOUND', 404);
    }

    await roleRef.update({
      name,
      permissions,
      updatedAt: new Date(),
      updatedBy: (req as any).ownerUser.id
    });

    res.status(200).json({ success: true });
  }

  async delete(req: Request, res: Response) {
    const tenantId = (req as any).ownerUser.tenantId;
    const roleId = req.params.id as string;

    // Optional: Check if staff uses this role
    const staffRef = await db.collection('users').where('tenantId', '==', tenantId).where('roleId', '==', roleId).get();
    if (!staffRef.empty) {
      throw new AppError('Cannot delete role in use by staff', 'CONFLICT', 409);
    }

    const roleRef = db.collection('roles').doc(roleId);
    await roleRef.update({
      status: 'INACTIVE',
      updatedAt: new Date(),
      updatedBy: (req as any).ownerUser.id
    });
    res.status(200).json({ success: true });
  }
}
