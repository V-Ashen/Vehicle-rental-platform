import { BaseRepository } from './BaseRepository';
import { Rental } from '../types';

export class RentalRepository extends BaseRepository<Rental> {
  constructor() {
    super('rentals');
  }
}
