import { BaseRepository } from './BaseRepository';
import { RentalHandover } from '../types';

export class RentalHandoverRepository extends BaseRepository<RentalHandover> {
  constructor() {
    super('rentalHandovers');
  }
}
