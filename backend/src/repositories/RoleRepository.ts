import { BaseRepository } from './BaseRepository';
import { Role } from '../types';

export class RoleRepository extends BaseRepository<Role> {
  constructor() {
    super('roles');
  }
}
