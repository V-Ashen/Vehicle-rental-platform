import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { BaseEntity } from '../types';

export class BaseRepository<T extends BaseEntity> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected get collection() {
    return db.collection(this.collectionName);
  }

  /**
   * Retrieves a document ensuring tenant isolation.
   * If tenantId is null, it bypasses tenant check (useful for global config or SaaS admins, use carefully).
   */
  async findById(id: string, tenantId?: string): Promise<T | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    
    const data = doc.data() as T;
    
    // Strict Tenant Isolation Rule
    if (tenantId && (data as any).tenantId !== tenantId) {
      return null;
    }
    return data;
  }

  async findByQuery(field: string, operator: any, value: any, tenantId?: string): Promise<T[]> {
    let query: any = this.collection.where(field, operator, value);
    
    if (tenantId) {
      query = query.where('tenantId', '==', tenantId);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => doc.data() as T);
  }

  /**
   * Retrieves paginated documents using cursor based pagination.
   */
  async findAllPaginated(limit: number, cursorId?: string, orderByField: string = 'createdAt', direction: 'asc'|'desc' = 'desc', filters: {field: string, operator: any, value: any}[] = []): Promise<{data: T[], nextCursor: string | null}> {
    let query: any = this.collection;
    
    for (const filter of filters) {
      query = query.where(filter.field, filter.operator, filter.value);
    }

    query = query.orderBy(orderByField, direction).limit(limit);

    if (cursorId) {
      const cursorDoc = await this.collection.doc(cursorId).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const data = snapshot.docs.map((doc: any) => doc.data() as T);
    const nextCursor = snapshot.docs.length === limit ? snapshot.docs[snapshot.docs.length - 1].id : null;
    
    return { data, nextCursor };
  }

  /**
   * Returns total count using Firestore's native count API.
   */
  async count(filters: {field: string, operator: any, value: any}[] = []): Promise<number> {
    let query: any = this.collection;
    for (const filter of filters) {
      query = query.where(filter.field, filter.operator, filter.value);
    }
    const snapshot = await query.count().get();
    return snapshot.data().count;
  }

  async create(id: string, data: Partial<T>): Promise<T> {
    const now = new Date();
    const docData = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      status: data.status || 'ACTIVE'
    };
    
    await this.collection.doc(id).set(docData);
    return docData as T;
  }

  async update(id: string, data: Partial<T>, tenantId?: string): Promise<T | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    await this.collection.doc(id).update(updateData);
    return { ...existing, ...updateData } as T;
  }
}
