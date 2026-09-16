import { BaseRepository } from './BaseRepository';
import { Tenant } from '../types';

export class TenantRepository extends BaseRepository<Tenant> {
  constructor() {
    super('tenants');
  }
}
