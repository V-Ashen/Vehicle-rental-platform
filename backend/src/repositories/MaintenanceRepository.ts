import { BaseRepository } from './BaseRepository';
import { MaintenanceRecord } from '../types';

export class MaintenanceRepository extends BaseRepository<MaintenanceRecord> {
  constructor() {
    super('maintenanceRecords');
  }
}
