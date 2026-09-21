import { MaintenanceRepository } from '../repositories/MaintenanceRepository';
import { generateId, IdPrefix } from '../utils/idGenerator';
import { AppError } from '../utils/AppError';
import { db } from '../config/firebase';

const maintenanceRepo = new MaintenanceRepository();

export class MaintenanceService {
  async createMaintenance(tenantId: string, data: any, userId: string) {
    const { markVehicleAvailable, serviceDate, nextServiceDate, ...rest } = data;
    
    const recordId = generateId(IdPrefix.MAINTENANCE);
    const vehicleRef = db.collection('vehicles').doc(data.vehicleId);
    
    try {
      let createdRecord: any = null;
      
      await db.runTransaction(async (t) => {
        const vehicleDoc = await t.get(vehicleRef);
        if (!vehicleDoc.exists) throw new AppError('Vehicle not found', 'NOT_FOUND', 404);
        
        const vehicle = vehicleDoc.data();
        if (vehicle?.tenantId !== tenantId) throw new AppError('Vehicle not found', 'NOT_FOUND', 404);
        
        const recordData = {
          id: recordId,
          tenantId,
          vehicleRegistration: vehicle.registrationNumber,
          vehicleMakeModel: `${vehicle.make} ${vehicle.model}`,
          ...rest,
          serviceDate: new Date(serviceDate),
          nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
          status: 'ACTIVE'
        };
        
        const recordRef = db.collection('maintenanceRecords').doc(recordId);
        t.set(recordRef, recordData);
        
        if (markVehicleAvailable) {
          t.update(vehicleRef, {
            status: 'AVAILABLE',
            updatedAt: new Date(),
            updatedBy: userId
          });
        }
        
        createdRecord = recordData;
      });
      
      return createdRecord;
    } catch (e: any) {
      if (e instanceof AppError) throw e;
      throw new AppError(`Maintenance transaction failed: ${e.message}`, 'INTERNAL_SERVER_ERROR', 500);
    }
  }

  async getMaintenanceRecords(tenantId: string, limit: number, startAfterId?: string, vehicleId?: string) {
    const filters = [{ field: 'tenantId', operator: '==', value: tenantId }];
    if (vehicleId) {
      filters.push({ field: 'vehicleId', operator: '==', value: vehicleId });
    }
    return maintenanceRepo.findAllPaginated(limit, startAfterId, 'createdAt', 'desc', filters);
  }

  async getMaintenanceRecord(id: string, tenantId: string) {
    const record = await maintenanceRepo.findById(id, tenantId);
    if (!record || record.tenantId !== tenantId) {
      throw new AppError('Maintenance record not found', 'NOT_FOUND', 404);
    }
    return record;
  }
}
