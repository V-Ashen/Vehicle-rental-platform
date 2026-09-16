import { BaseRepository } from './BaseRepository';
import { Customer } from '../types';

export class CustomerRepository extends BaseRepository<Customer> {
  constructor() {
    super('customers');
  }
}
