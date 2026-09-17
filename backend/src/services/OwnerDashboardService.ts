import { VehicleRepository } from '../repositories/VehicleRepository';
import { RentalRepository } from '../repositories/RentalRepository';

const vehicleRepo = new VehicleRepository();
const rentalRepo = new RentalRepository();

export class OwnerDashboardService {
  async getDashboardMetrics(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalVehicles,
      availableVehicles,
      onRentVehicles,
      inMaintenanceVehicles,
      pickupsToday,
      returnsToday,
      overdueRentals
    ] = await Promise.all([
      vehicleRepo.count([{ field: 'tenantId', operator: '==', value: tenantId }]),
      vehicleRepo.count([
        { field: 'tenantId', operator: '==', value: tenantId },
        { field: 'status', operator: '==', value: 'AVAILABLE' }
      ]),
      vehicleRepo.count([
        { field: 'tenantId', operator: '==', value: tenantId },
        { field: 'status', operator: '==', value: 'RENTED' }
      ]),
      vehicleRepo.count([
        { field: 'tenantId', operator: '==', value: tenantId },
        { field: 'status', operator: '==', value: 'MAINTENANCE' }
      ]),
      rentalRepo.count([
        { field: 'tenantId', operator: '==', value: tenantId },
        { field: 'status', operator: 'in', value: ['CONFIRMED', 'IN_PROGRESS'] },
        { field: 'startDate', operator: '>=', value: today },
        { field: 'startDate', operator: '<', value: tomorrow }
      ]),
      rentalRepo.count([
        { field: 'tenantId', operator: '==', value: tenantId },
        { field: 'status', operator: '==', value: 'IN_PROGRESS' },
        { field: 'endDate', operator: '>=', value: today },
        { field: 'endDate', operator: '<', value: tomorrow }
      ]),
      rentalRepo.count([
        { field: 'tenantId', operator: '==', value: tenantId },
        { field: 'status', operator: '==', value: 'IN_PROGRESS' },
        { field: 'endDate', operator: '<', value: today }
      ])
    ]);

    return {
      vehicles: {
        total: totalVehicles,
        available: availableVehicles,
        onRent: onRentVehicles,
        inMaintenance: inMaintenanceVehicles
      },
      operations: {
        pickupsToday,
        returnsToday,
        overdueRentals
      }
    };
  }
}
