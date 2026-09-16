import { BaseRepository } from './BaseRepository';
import { Subscription } from '../types';

export class SubscriptionRepository extends BaseRepository<Subscription> {
  constructor() {
    super('subscriptions');
  }
}
