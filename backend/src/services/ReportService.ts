import { AggregateField } from 'firebase-admin/firestore';
import { db } from '../config/firebase';

export class ReportService {
  async getFinancialReport(tenantId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const returnsRef = db.collection('rentalReturns');
    
    // Build the query
    const query = returnsRef
      .where('tenantId', '==', tenantId)
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end);

    // Utilize Firestore's native aggregation API
    const aggregateQuery = query.aggregate({
      totalRevenue: AggregateField.sum('finalTotal'),
      totalExtraKm: AggregateField.sum('extraKmCharge'),
      totalLate: AggregateField.sum('lateCharge'),
      totalDamage: AggregateField.sum('damageTotal')
    });

    const snapshot = await aggregateQuery.get();
    const data = snapshot.data();

    return {
      period: { startDate, endDate },
      totalRevenue: data.totalRevenue || 0,
      totalExtraKm: data.totalExtraKm || 0,
      totalLate: data.totalLate || 0,
      totalDamage: data.totalDamage || 0
    };
  }
}
