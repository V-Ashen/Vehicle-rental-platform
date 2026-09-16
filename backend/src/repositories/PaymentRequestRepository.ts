import { BaseRepository } from './BaseRepository';
import { PaymentRequest } from '../types';

export class PaymentRequestRepository extends BaseRepository<PaymentRequest> {
  constructor() {
    super('paymentRequests');
  }
}
