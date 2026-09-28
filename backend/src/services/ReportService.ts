import { AggregateField } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository';
import { PackageRepository } from '../repositories/PackageRepository';
import { AppError } from '../utils/AppError';
import { Parser } from 'json2csv';

const subRepo = new SubscriptionRepository();
const packageRepo = new PackageRepository();

export class ReportService {
  private async checkAdvancedReportsAccess(tenantId: string) {
    const subs = await subRepo.findByQuery('tenantId', '==', tenantId);
    const activeSub = subs.find(s => s.status === 'ACTIVE' || s.status === 'TRIAL');
    if (activeSub && activeSub.packageId) {
      const pkg = await packageRepo.findById(activeSub.packageId);
      if (!pkg || (!pkg.features?.advancedReporting && !pkg.features?.allFeatures)) {
        throw new AppError('Please upgrade your package to access advanced reports.', 'FORBIDDEN', 403);
      }
    } else {
      throw new AppError('No active subscription found.', 'FORBIDDEN', 403);
    }
  }

  async getFinancialReport(tenantId: string, startDate: string, endDate: string) {
    await this.checkAdvancedReportsAccess(tenantId);
    
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

  async getDetailedReport(tenantId: string, filters: any) {
    await this.checkAdvancedReportsAccess(tenantId);
    return this._fetchDetailedData(tenantId, filters);
  }

  async exportDetailedReport(tenantId: string, filters: any) {
    await this.checkAdvancedReportsAccess(tenantId);
    const data = await this._fetchDetailedData(tenantId, filters);
    
    const parser = new Parser({
      fields: [
        { label: 'Rental ID', value: 'id' },
        { label: 'Vehicle', value: 'vehicleName' },
        { label: 'Customer', value: 'customerName' },
        { label: 'Start Date', value: 'startDate' },
        { label: 'End Date', value: 'endDate' },
        { label: 'Status', value: 'status' },
        { label: 'Branch ID', value: 'branchId' },
        { label: 'Base Amount', value: 'baseRentalAmount' },
        { label: 'Final Total', value: 'finalTotal' }
      ]
    });
    
    return parser.parse(data);
  }

  private async _fetchDetailedData(tenantId: string, filters: any) {
    const { startDate, endDate, status, branchId, vehicleId } = filters;
    
    let query = db.collection('rentals').where('tenantId', '==', tenantId);
    
    if (status) query = query.where('status', '==', status);
    if (branchId) query = query.where('branchId', '==', branchId);
    if (vehicleId) query = query.where('vehicleId', '==', vehicleId);
    
    // We fetch without date filters first because Firestore requires composite index for multiple fields
    // Or we just do date filtering in memory if it's too complex, but let's try querying by createdAt
    if (startDate && endDate) {
      query = query.where('createdAt', '>=', new Date(startDate)).where('createdAt', '<=', new Date(endDate));
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    const results = [];
    for (const doc of snapshot.docs) {
      const rental = doc.data();
      let finalTotal = rental.totalAmount;
      
      // If completed, fetch return record for exact totals
      if (rental.status === 'COMPLETED') {
        const returnQuery = await db.collection('rentalReturns').where('rentalId', '==', doc.id).limit(1).get();
        if (!returnQuery.empty) {
          finalTotal = returnQuery.docs[0].data().finalTotal;
        }
      }

      // Fetch Vehicle and Customer names for export
      const [vehicleDoc, customerDoc] = await Promise.all([
        db.collection('vehicles').doc(rental.vehicleId).get(),
        db.collection('customers').doc(rental.customerId).get()
      ]);

      const vData = vehicleDoc.exists ? vehicleDoc.data() : null;
      const cData = customerDoc.exists ? customerDoc.data() : null;

      results.push({
        id: doc.id,
        vehicleName: vData ? `${vData.make} ${vData.model} (${vData.licensePlate})` : rental.vehicleId,
        customerName: cData ? cData.fullName : rental.customerId,
        startDate: rental.startDate?.toDate ? rental.startDate.toDate().toLocaleString() : rental.startDate,
        endDate: rental.endDate?.toDate ? rental.endDate.toDate().toLocaleString() : rental.endDate,
        status: rental.status,
        branchId: rental.branchId,
        baseRentalAmount: rental.baseRentalAmount || rental.totalAmount,
        finalTotal
      });
    }

    return results;
  }
}
