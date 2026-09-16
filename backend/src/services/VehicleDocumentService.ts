import { VehicleDocumentRepository } from '../repositories/VehicleDocumentRepository';
import { generateId, IdPrefix } from '../utils/idGenerator';
import { AppError } from '../utils/AppError';

const docRepo = new VehicleDocumentRepository();

export class VehicleDocumentService {
  async createDocument(tenantId: string, vehicleId: string, data: any, userId: string) {
    const docId = generateId(IdPrefix.VEHDOC);
    return docRepo.create(docId, {
      ...data,
      vehicleId,
      tenantId,
      issueDate: new Date(data.issueDate),
      expiryDate: new Date(data.expiryDate),
      status: 'ACTIVE',
      createdBy: userId,
      updatedBy: userId
    });
  }

  async getDocuments(tenantId: string, vehicleId: string, limit: number, startAfterId?: string) {
    const filters = [
      { field: 'tenantId', operator: '==', value: tenantId },
      { field: 'vehicleId', operator: '==', value: vehicleId }
    ];
    return docRepo.findAllPaginated(limit, startAfterId, 'createdAt', 'desc', filters);
  }
}
