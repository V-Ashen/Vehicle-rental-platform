import { BaseRepository } from './BaseRepository';
import { VehicleDocument } from '../types';

export class VehicleDocumentRepository extends BaseRepository<VehicleDocument> {
  constructor() {
    super('vehicleDocuments');
  }
}
