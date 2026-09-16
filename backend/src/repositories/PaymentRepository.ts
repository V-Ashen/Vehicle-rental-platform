import { BaseRepository } from './BaseRepository';
import { Payment } from '../types';

export class PaymentRepository extends BaseRepository<Payment> {
  constructor() {
    super('payments');
  }
}
