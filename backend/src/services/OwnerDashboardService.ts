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

    const [vehicles, rentals] = await Promise.all([
      vehicleRepo.findByQuery('tenantId', '==', tenantId),
      rentalRepo.findByQuery('tenantId', '==', tenantId)
    ]);

    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter((v: any) => v.status === 'AVAILABLE').length;
    const onRentVehicles = vehicles.filter((v: any) => v.status === 'ON_RENT' || v.status === 'RENTED').length;
    const inMaintenanceVehicles = vehicles.filter((v: any) => v.status === 'MAINTENANCE').length;

    const pickupsToday = rentals.filter((r: any) => 
      (r.status === 'CONFIRMED' || r.status === 'IN_PROGRESS') && 
      new Date(r.startDate) >= today && 
      new Date(r.startDate) < tomorrow
    ).length;

    const returnsToday = rentals.filter((r: any) => 
      r.status === 'IN_PROGRESS' && 
      new Date(r.endDate) >= today && 
      new Date(r.endDate) < tomorrow
    ).length;

    const overdueRentals = rentals.filter((r: any) => 
      r.status === 'IN_PROGRESS' && 
      new Date(r.endDate) < today
    ).length;

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
