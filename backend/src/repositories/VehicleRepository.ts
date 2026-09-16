import { BaseRepository } from './BaseRepository';
import { Vehicle } from '../types';
import { db } from '../config/firebase';

export class VehicleRepository extends BaseRepository<Vehicle> {
  constructor() {
    super('vehicles');
  }

  async findByRegistrationAndTenant(registrationNumber: string, tenantId: string): Promise<Vehicle | null> {
    const snapshot = await db.collection(this.collectionName)
      .where('tenantId', '==', tenantId)
      .where('registrationNumber', '==', registrationNumber)
      .limit(1)
      .get();
      
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Vehicle;
  }
}
