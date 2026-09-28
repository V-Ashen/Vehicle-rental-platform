import { VehicleRepository } from '../repositories/VehicleRepository';
import { RentalRepository } from '../repositories/RentalRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { db } from '../config/firebase';

const vehicleRepo = new VehicleRepository();
const rentalRepo = new RentalRepository();
const customerRepo = new CustomerRepository();

export class OwnerDashboardService {
  async getDashboardMetrics(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

    // Fetch all vehicles and rentals in parallel
    const [vehicles, allRentals] = await Promise.all([
      vehicleRepo.findByQuery('tenantId', '==', tenantId),
      rentalRepo.findByQuery('tenantId', '==', tenantId)
    ]);

    // Vehicle fleet stats
    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter((v: any) => v.status === 'AVAILABLE').length;
    const onRentVehicles = vehicles.filter((v: any) => v.status === 'ON_RENT').length;
    const reservedVehicles = vehicles.filter((v: any) => v.status === 'RESERVED').length;
    const inMaintenanceVehicles = vehicles.filter((v: any) => v.status === 'MAINTENANCE').length;

    // Rental status helpers
    const normalizeDate = (d: any): Date | null => {
      if (!d) return null;
      if (d.toDate) return d.toDate();
      return new Date(d);
    };

    // Today's operations
    const pickupsToday = allRentals.filter((r: any) => {
      const pickup = normalizeDate(r.pickupAt);
      return pickup && pickup >= today && pickup < tomorrow && r.status === 'RESERVED';
    }).length;

    const returnsToday = allRentals.filter((r: any) => {
      const expectedReturn = normalizeDate(r.expectedReturnAt);
      return expectedReturn && expectedReturn >= today && expectedReturn < tomorrow && r.status === 'ON_RENT';
    }).length;

    const overdueRentals = allRentals.filter((r: any) => {
      const expectedReturn = normalizeDate(r.expectedReturnAt);
      return expectedReturn && expectedReturn < today && r.status === 'ON_RENT';
    }).length;

    const activeRentals = allRentals.filter((r: any) => r.status === 'ON_RENT').length;

    // Revenue calculations
    const completedRentals = allRentals.filter((r: any) => r.status === 'COMPLETED');
    const thisMonthRentals = completedRentals.filter((r: any) => {
      const createdAt = normalizeDate(r.createdAt);
      return createdAt && createdAt >= startOfMonth;
    });
    const lastMonthRentals = completedRentals.filter((r: any) => {
      const createdAt = normalizeDate(r.createdAt);
      return createdAt && createdAt >= startOfLastMonth && createdAt <= endOfLastMonth;
    });

    const revenueThisMonth = thisMonthRentals.reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0);
    const revenueLastMonth = lastMonthRentals.reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0);
    const totalRevenue = completedRentals.reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0);
    const totalRentals = allRentals.length;
    const totalCustomers = await customerRepo.count([{ field: 'tenantId', operator: '==', value: tenantId }]).catch(() => 0);

    // Recent rentals (last 5 active/recent)
    const recentRentals = allRentals
      .filter((r: any) => r.status === 'ON_RENT' || r.status === 'RESERVED' || r.status === 'COMPLETED')
      .sort((a: any, b: any) => {
        const aDate = normalizeDate(a.createdAt)?.getTime() || 0;
        const bDate = normalizeDate(b.createdAt)?.getTime() || 0;
        return bDate - aDate;
      })
      .slice(0, 5);

    // Fetch customer names for recent rentals
    const customerIds = [...new Set(recentRentals.map((r: any) => r.customerId))];
    const customerNames = new Map<string, string>();
    await Promise.all(customerIds.map(async (cid: any) => {
      const cust = await customerRepo.findById(cid, tenantId);
      if (cust) customerNames.set(cid, cust.fullName);
    }));

    const vehicleIds = [...new Set(recentRentals.map((r: any) => r.vehicleId))];
    const vehicleRegs = new Map<string, string>();
    await Promise.all(vehicleIds.map(async (vid: any) => {
      const v = await vehicleRepo.findById(vid, tenantId);
      if (v) vehicleRegs.set(vid, `${v.make} ${v.model}`);
    }));

    const recentRentalsFormatted = recentRentals.map((r: any) => ({
      id: r.id,
      rentalNumber: r.id,
      customerName: customerNames.get(r.customerId) || 'Unknown',
      vehicleName: vehicleRegs.get(r.vehicleId) || 'Unknown',
      status: r.status,
      totalAmount: r.totalAmount || 0,
      pickupAt: normalizeDate(r.pickupAt)?.toISOString() || null,
      expectedReturnAt: normalizeDate(r.expectedReturnAt)?.toISOString() || null,
    }));

    // Fleet utilization (on rent / total)
    const utilizationRate = totalVehicles > 0
      ? Math.round(((onRentVehicles + reservedVehicles) / totalVehicles) * 100)
      : 0;

    return {
      vehicles: {
        total: totalVehicles,
        available: availableVehicles,
        onRent: onRentVehicles,
        reserved: reservedVehicles,
        inMaintenance: inMaintenanceVehicles,
        utilizationRate,
      },
      operations: {
        pickupsToday,
        returnsToday,
        overdueRentals,
        activeRentals,
      },
      revenue: {
        thisMonth: revenueThisMonth,
        lastMonth: revenueLastMonth,
        total: totalRevenue,
        growthPercent: revenueLastMonth > 0
          ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
          : null,
      },
      totals: {
        rentals: totalRentals,
        customers: totalCustomers,
        completedRentals: completedRentals.length,
      },
      recentRentals: recentRentalsFormatted,
    };
  }
}
