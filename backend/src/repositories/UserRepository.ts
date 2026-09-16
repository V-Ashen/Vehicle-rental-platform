import { BaseRepository } from './BaseRepository';
import { User } from '../types';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const users = await this.findByQuery('firebaseUid', '==', firebaseUid);
    return users.length > 0 ? users[0] : null;
  }
}
