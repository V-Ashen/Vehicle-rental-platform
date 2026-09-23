import { db } from '../config/firebase';
import { Payment } from '../types';

export class AdminPaymentService {
  async listPayments(limit: number = 20, cursor?: string, status?: string) {
    const paymentsRef = db.collection('payments');
    let q: FirebaseFirestore.Query = paymentsRef;

    if (status) {
      q = q.where('status', '==', status);
    }
    
    // Always order by createdAt descending
    q = q.orderBy('createdAt', 'desc');

    if (cursor) {
      // Find the document to start after
      const docRef = await paymentsRef.doc(cursor).get();
      if (docRef.exists) {
        q = q.startAfter(docRef);
      }
    }

    q = q.limit(limit);

    const snapshot = await q.get();
    
    if (snapshot.empty) {
      return {
        payments: [],
        pagination: {
          nextCursor: null,
          totalCount: 0 // Optional: count requires another query, we can skip for now or do an aggregate
        }
      };
    }

    const rawPayments: any[] = [];
    snapshot.forEach(doc => rawPayments.push(doc.data()));

    // Collect unique tenantIds and packageIds
    const tenantIds = new Set<string>();
    const packageIds = new Set<string>();

    rawPayments.forEach(p => {
      if (p.tenantId) tenantIds.add(p.tenantId);
      if (p.metadata?.packageId) packageIds.add(p.metadata.packageId);
    });

    // Fetch tenants in batches of 10 (Firestore 'in' query limit)
    const tenantsMap = new Map<string, any>();
    const tenantIdsArray = Array.from(tenantIds);
    for (let i = 0; i < tenantIdsArray.length; i += 10) {
      const batch = tenantIdsArray.slice(i, i + 10);
      if (batch.length > 0) {
        const tenantsSnap = await db.collection('tenants').where('id', 'in', batch).get();
        tenantsSnap.forEach(t => tenantsMap.set(t.id, t.data()));
      }
    }

    // Fetch packages in batches of 10
    const packagesMap = new Map<string, any>();
    const packageIdsArray = Array.from(packageIds);
    for (let i = 0; i < packageIdsArray.length; i += 10) {
      const batch = packageIdsArray.slice(i, i + 10);
      if (batch.length > 0) {
        const packagesSnap = await db.collection('packages').where('id', 'in', batch).get();
        packagesSnap.forEach(p => packagesMap.set(p.id, p.data()));
      }
    }

    // Map the names onto the payments
    const enrichedPayments = rawPayments.map(p => {
      const tenant = p.tenantId ? tenantsMap.get(p.tenantId) : null;
      const pkg = p.metadata?.packageId ? packagesMap.get(p.metadata.packageId) : null;
      
      return {
        ...p,
        tenantName: tenant ? tenant.businessName : 'Unknown Business',
        packageName: pkg ? pkg.name : 'Unknown Package'
      };
    });

    const nextCursor = enrichedPayments.length === limit ? enrichedPayments[enrichedPayments.length - 1].id : null;

    // Get total count
    let countQuery: FirebaseFirestore.Query = paymentsRef;
    if (status) {
      countQuery = countQuery.where('status', '==', status);
    }
    const countSnap = await countQuery.count().get();
    const totalCount = countSnap.data().count;

    return {
      payments: enrichedPayments,
      pagination: {
        nextCursor,
        totalCount
      }
    };
  }
}
