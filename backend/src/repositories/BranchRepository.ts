import { BaseRepository } from './BaseRepository';
import { Branch } from '../types';
import { db } from '../config/firebase';

export class BranchRepository extends BaseRepository<Branch> {
  constructor() {
    super('branches');
  }

  async findByTenantId(tenantId: string): Promise<Branch[]> {
    const snapshot = await this.collection
      .where('tenantId', '==', tenantId)
      .orderBy('createdAt', 'desc')
      .get();
      
    if (snapshot.empty) return [];
    
    return snapshot.docs.map(doc => doc.data() as Branch);
  }

  async countByTenantId(tenantId: string): Promise<number> {
    const snapshot = await this.collection
      .where('tenantId', '==', tenantId)
      .where('status', '==', 'ACTIVE') // Active branches count against limit
      .count()
      .get();
      
    return snapshot.data().count;
  }
}
