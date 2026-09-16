import { BaseRepository } from './BaseRepository';
import { Package } from '../types';

export class PackageRepository extends BaseRepository<Package> {
  constructor() {
    super('packages');
  }

  async findByName(name: string): Promise<Package | null> {
    const pkgs = await this.findByQuery('name', '==', name);
    return pkgs.length > 0 ? pkgs[0] : null;
  }
}
