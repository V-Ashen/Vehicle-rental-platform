import { BaseRepository } from './BaseRepository';
import { Notification } from '../types';

export class NotificationRepository extends BaseRepository<Notification> {
  constructor() {
    super('notifications');
  }
}
