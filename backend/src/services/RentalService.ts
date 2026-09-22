import { RentalRepository } from '../repositories/RentalRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { RentalHandoverRepository } from '../repositories/RentalHandoverRepository';
import { generateId, IdPrefix } from '../utils/idGenerator';
import { AppError } from '../utils/AppError';
import { db } from '../config/firebase';
import { NotificationService } from './NotificationService';

const rentalRepo = new RentalRepository();
const vehicleRepo = new VehicleRepository();
const customerRepo = new CustomerRepository();
const handoverRepo = new RentalHandoverRepository();
const notificationService = new NotificationService();

export class RentalService {
  async getAllRentals(tenantId: string) {
    try {
      const rentalsSnapshot = await db.collection('rentals')
        .where('tenantId', '==', tenantId)
        .orderBy('createdAt', 'desc')
        .get();

      if (rentalsSnapshot.empty) return [];

      const rentals = rentalsSnapshot.docs.map(doc => doc.data());

      // Fetch related customer and vehicle data
      const customerIds = [...new Set(rentals.map(r => r.customerId))];
      const vehicleIds = [...new Set(rentals.map(r => r.vehicleId))];

      const customersMap = new Map();
      const vehiclesMap = new Map();

      if (customerIds.length > 0) {
        // Chunk into groups of 10 for Firestore 'in' query if needed, but since we are simple, we'll just fetch them
        // To be safe, we'll fetch them individually since tenant repositories usually do that well
        for (const cid of customerIds) {
          const cust = await customerRepo.findById(cid, tenantId);
          if (cust) customersMap.set(cid, cust.fullName);
        }
      }

      if (vehicleIds.length > 0) {
        for (const vid of vehicleIds) {
          const veh = await vehicleRepo.findById(vid, tenantId);
          if (veh) vehiclesMap.set(vid, veh.registrationNumber);
        }
      }

      return rentals.map(r => ({
        ...r,
        pickupAt: r.pickupAt?.toDate?.()?.toISOString() || r.pickupAt,
        expectedReturnAt: r.expectedReturnAt?.toDate?.()?.toISOString() || r.expectedReturnAt,
        actualReturnAt: r.actualReturnAt?.toDate?.()?.toISOString() || r.actualReturnAt,
        createdAt: r.createdAt?.toDate?.()?.toISOString() || r.createdAt,
        updatedAt: r.updatedAt?.toDate?.()?.toISOString() || r.updatedAt,
        customerName: customersMap.get(r.customerId) || 'Unknown Customer',
        vehicleRegistration: vehiclesMap.get(r.vehicleId) || 'Unknown Vehicle',
        rentalNumber: r.id.substring(4) // e.g. RNT-1234 -> 1234 for short display
      }));
    } catch (e: any) {
      throw new AppError(`Failed to fetch rentals: ${e.message}`, 'INTERNAL_SERVER_ERROR', 500);
    }
  }

  async getRentalById(rentalId: string, tenantId: string) {
    try {
      const rentalDoc = await db.collection('rentals').doc(rentalId).get();
      if (!rentalDoc.exists) throw new AppError('Rental not found', 'NOT_FOUND', 404);
      
      const rental = rentalDoc.data();
      if (rental?.tenantId !== tenantId) throw new AppError('Rental not found', 'NOT_FOUND', 404);

      // Fetch related vehicle
      const vehicle = await vehicleRepo.findById(rental.vehicleId, tenantId);

      // Fetch related pickup handover to get startOdometer
      const handoverQuery = await db.collection('rentalHandovers')
        .where('rentalId', '==', rentalId)
        .where('type', '==', 'PICKUP')
        .limit(1)
        .get();

      let pickupHandover = null;
      if (!handoverQuery.empty) {
        pickupHandover = handoverQuery.docs[0].data();
      }

      return {
        ...rental,
        pickupAt: rental.pickupAt?.toDate?.()?.toISOString() || rental.pickupAt,
        expectedReturnAt: rental.expectedReturnAt?.toDate?.()?.toISOString() || rental.expectedReturnAt,
        actualReturnAt: rental.actualReturnAt?.toDate?.()?.toISOString() || rental.actualReturnAt,
        createdAt: rental.createdAt?.toDate?.()?.toISOString() || rental.createdAt,
        updatedAt: rental.updatedAt?.toDate?.()?.toISOString() || rental.updatedAt,
        vehicleRegistration: vehicle?.registrationNumber || 'Unknown',
        vehicleMakeModel: `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim(),
        startOdometer: pickupHandover?.odometer || 0,
        pickupHandover
      };
    } catch (e: any) {
      if (e instanceof AppError) throw e;
      throw new AppError(`Failed to fetch rental: ${e.message}`, 'INTERNAL_SERVER_ERROR', 500);
    }
  }

  async createRental(tenantId: string, data: any, userId: string) {
    const { customerId, vehicleId, pickupAt, expectedReturnAt, depositAmount } = data;

    // Validate customer
    const customer = await customerRepo.findById(customerId, tenantId);
    if (!customer) throw new AppError('Customer not found', 'NOT_FOUND', 404);

    const pickupDate = new Date(pickupAt);
    const returnDate = new Date(expectedReturnAt);
    
    if (pickupDate >= returnDate) {
      throw new AppError('Return date must be after pickup date', 'VALIDATION_ERROR', 400);
    }

    const diffHours = Math.abs(returnDate.getTime() - pickupDate.getTime()) / 36e5;
    const rentalDays = Math.ceil(diffHours / 24) || 1; // Minimum 1 day

    const vehicleRef = db.collection('vehicles').doc(vehicleId);
    const rentalId = generateId(IdPrefix.RENTAL);
    const rentalRef = db.collection('rentals').doc(rentalId);

    let createdRental: any = null;

    try {
      await db.runTransaction(async (t) => {
        const vehicleDoc = await t.get(vehicleRef);
        
        if (!vehicleDoc.exists) {
          throw new AppError('Vehicle not found', 'NOT_FOUND', 404);
        }

        const vehicle = vehicleDoc.data();
        if (vehicle?.tenantId !== tenantId) {
          throw new AppError('Vehicle not found', 'NOT_FOUND', 404);
        }

        if (vehicle?.status !== 'AVAILABLE') {
          throw new AppError('VEHICLE_NOT_AVAILABLE', 'CONFLICT', 409);
        }

        const baseRentalAmount = rentalDays * (vehicle.dailyRate || 0);

        const rentalData = {
          id: rentalId,
          tenantId,
          customerId,
          vehicleId,
          pickupAt: pickupDate,
          expectedReturnAt: returnDate,
          actualReturnAt: null,
          rentalDays,
          dailyRateSnapshot: vehicle.dailyRate || 0,
          extraKmRateSnapshot: vehicle.extraKmRate || 0,
          includedKmSnapshot: rentalDays * (vehicle.includedKmPerDay || 0),
          baseRentalAmount,
          extraKmCharge: 0,
          lateCharge: 0,
          damageCharges: 0,
          otherCharges: 0,
          totalAmount: baseRentalAmount,
          status: 'RESERVED',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId
        };

        t.update(vehicleRef, {
          status: 'RESERVED',
          updatedAt: new Date(),
          updatedBy: userId
        });

        t.set(rentalRef, rentalData);
        createdRental = rentalData;

        // Create Deposit record if applicable
        if (depositAmount && depositAmount > 0) {
          const depositId = generateId(IdPrefix.SYSTEM); // or DEP-
          const depositRef = db.collection('deposits').doc(depositId);
          t.set(depositRef, {
            id: depositId,
            tenantId,
            rentalId,
            customerId,
            amount: depositAmount,
            status: 'HELD',
            deductedAmount: 0,
            refundedAmount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: userId,
            updatedBy: userId
          });
        }
      });

      // Fire and forget notification queueing (Retrofit for Phase 6)
      notificationService.queueNotification(tenantId, customerId, {
        type: 'BOOKING_CONFIRMATION',
        channel: 'EMAIL',
        subject: 'Your Booking is Confirmed!',
        message: `Your rental for vehicle ${vehicleId} is confirmed from ${pickupDate.toISOString()} to ${returnDate.toISOString()}.`
      }).catch(err => console.error('Failed to queue notification', err));

      return createdRental;
    } catch (e: any) {
      if (e instanceof AppError) throw e;
      throw new AppError(`Rental transaction failed: ${e.message}`, 'INTERNAL_SERVER_ERROR', 500);
    }
  }

  async handover(rentalId: string, tenantId: string, data: any, userId: string) {
    const { odometer, fuelLevel, conditionStatus, photoUrls, notes } = data;

    const rentalRef = db.collection('rentals').doc(rentalId);
    
    try {
      let result: any = null;
      await db.runTransaction(async (t) => {
        const rentalDoc = await t.get(rentalRef);
        if (!rentalDoc.exists) throw new AppError('Rental not found', 'NOT_FOUND', 404);
        
        const rental = rentalDoc.data();
        if (rental?.tenantId !== tenantId) throw new AppError('Rental not found', 'NOT_FOUND', 404);
        
        if (rental?.status !== 'RESERVED') {
          throw new AppError('Rental is not in RESERVED state', 'INVALID_STATE', 400);
        }

        const vehicleRef = db.collection('vehicles').doc(rental.vehicleId);
        const vehicleDoc = await t.get(vehicleRef);
        if (!vehicleDoc.exists) throw new AppError('Vehicle not found', 'NOT_FOUND', 404);

        const handoverId = generateId(IdPrefix.HANDOVER);
        const handoverRef = db.collection('rentalHandovers').doc(handoverId);

        const handoverData = {
          id: handoverId,
          tenantId,
          rentalId,
          vehicleId: rental.vehicleId,
          type: 'PICKUP',
          odometer,
          fuelLevel,
          conditionStatus,
          photoUrls: photoUrls || [],
          notes: notes || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
          status: 'ACTIVE'
        };

        t.set(handoverRef, handoverData);
        
        t.update(rentalRef, {
          status: 'ON_RENT',
          updatedAt: new Date(),
          updatedBy: userId
        });

        t.update(vehicleRef, {
          status: 'ON_RENT',
          currentOdometer: odometer,
          updatedAt: new Date(),
          updatedBy: userId
        });

        result = handoverData;
      });
      return result;
    } catch (e: any) {
      if (e instanceof AppError) throw e;
      throw new AppError(`Handover transaction failed: ${e.message}`, 'INTERNAL_SERVER_ERROR', 500);
    }
  }

  async returnRental(rentalId: string, tenantId: string, data: any, userId: string) {
    const { actualReturnAt, endOdometer, endFuelLevel, damages, otherCharges, requiresMaintenance, gracePeriodMinutes, hourlyLateCharge } = data;
    
    const rentalRef = db.collection('rentals').doc(rentalId);
    
    try {
      let result: any = null;
      await db.runTransaction(async (t) => {
        // 1. Fetch Rental
        const rentalDoc = await t.get(rentalRef);
        if (!rentalDoc.exists) throw new AppError('Rental not found', 'NOT_FOUND', 404);
        const rental = rentalDoc.data();
        if (rental?.tenantId !== tenantId) throw new AppError('Rental not found', 'NOT_FOUND', 404);
        if (rental?.status !== 'ON_RENT') throw new AppError('Rental is not currently ON_RENT', 'INVALID_STATE', 400);

        // 2. Fetch Vehicle
        const vehicleRef = db.collection('vehicles').doc(rental.vehicleId);
        const vehicleDoc = await t.get(vehicleRef);
        if (!vehicleDoc.exists) throw new AppError('Vehicle not found', 'NOT_FOUND', 404);

        // 3. Fetch Pickup Handover for startOdometer
        const handoverQuery = db.collection('rentalHandovers')
          .where('rentalId', '==', rentalId)
          .where('type', '==', 'PICKUP')
          .limit(1);
        const handoverSnapshot = await t.get(handoverQuery);
        if (handoverSnapshot.empty) throw new AppError('Pickup handover record not found', 'INTERNAL_ERROR', 500);
        const pickupHandover = handoverSnapshot.docs[0].data();
        const startOdometer = pickupHandover.odometer;

        // --- MATH CALCULATIONS ---
        
        // A. Extra KM
        const usedKm = endOdometer - startOdometer;
        const extraKm = Math.max(0, usedKm - (rental.includedKmSnapshot || 0));
        const extraKmCharge = extraKm * (rental.extraKmRateSnapshot || 0);

        // B. Late Return
        const returnDate = new Date(actualReturnAt);
        const expectedDate = new Date(rental.expectedReturnAt);
        const diffMs = returnDate.getTime() - expectedDate.getTime();
        const lateMinutes = diffMs > 0 ? diffMs / 60000 : 0;
        const billableLateMinutes = Math.max(0, lateMinutes - gracePeriodMinutes);
        
        let lateCharge = 0;
        if (billableLateMinutes > 0) {
          const lateHours = Math.ceil(billableLateMinutes / 60);
          lateCharge = lateHours * hourlyLateCharge;
        }

        // C. Damages
        const damageTotal = (damages || []).reduce((sum: number, d: any) => sum + (d.estimatedCost || 0), 0);
        const extraOtherCharges = otherCharges || 0;

        // D. Final Settlement
        const finalTotal = rental.baseRentalAmount + extraKmCharge + lateCharge + damageTotal + extraOtherCharges;

        // E. Deposit Deductions
        const depositQuery = db.collection('deposits')
          .where('rentalId', '==', rentalId)
          .where('status', '==', 'HELD')
          .limit(1);
        const depositSnapshot = await t.get(depositQuery);
        
        if (!depositSnapshot.empty) {
          const depositDoc = depositSnapshot.docs[0];
          const depositData = depositDoc.data();
          
          let amountToDeduct = 0;
          const excessCharges = extraKmCharge + lateCharge + damageTotal + extraOtherCharges;
          
          if (excessCharges > 0) {
            amountToDeduct = Math.min(excessCharges, depositData.amount);
          }

          const refundedAmount = depositData.amount - amountToDeduct;
          let newStatus = 'REFUNDED';
          if (amountToDeduct > 0) {
            newStatus = amountToDeduct === depositData.amount ? 'APPLIED' : 'PARTIALLY_REFUNDED';
          }

          t.update(depositDoc.ref, {
            status: newStatus,
            deductedAmount: amountToDeduct,
            refundedAmount,
            updatedAt: new Date(),
            updatedBy: userId
          });
        }

        // --- DATABASE UPDATES ---
        
        // Create Return Handover record
        const handoverId = generateId(IdPrefix.HANDOVER);
        const handoverRef = db.collection('rentalHandovers').doc(handoverId);
        t.set(handoverRef, {
          id: handoverId,
          tenantId,
          rentalId,
          vehicleId: rental.vehicleId,
          type: 'RETURN',
          odometer: endOdometer,
          fuelLevel: endFuelLevel,
          conditionStatus: damages?.length ? 'DAMAGED' : 'GOOD',
          photoUrls: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
          status: 'ACTIVE'
        });

        // Create RentalReturn (Financial Breakdown)
        const returnId = generateId(IdPrefix.RETURN);
        const returnRef = db.collection('rentalReturns').doc(returnId);
        const returnData = {
          id: returnId,
          tenantId,
          rentalId,
          vehicleId: rental.vehicleId,
          actualReturnAt: returnDate,
          endOdometer,
          usedKm,
          extraKm,
          lateMinutes,
          billableLateMinutes,
          baseRentalAmount: rental.baseRentalAmount,
          extraKmCharge,
          lateCharge,
          damageTotal,
          otherCharges: extraOtherCharges,
          finalTotal,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
          status: 'ACTIVE'
        };
        t.set(returnRef, returnData);

        // Create RentalDamages
        if (damages && damages.length > 0) {
          damages.forEach((d: any) => {
            const damageId = generateId(IdPrefix.DAMAGE);
            const damageRef = db.collection('rentalDamages').doc(damageId);
            t.set(damageRef, {
              ...d,
              id: damageId,
              tenantId,
              rentalId,
              vehicleId: rental.vehicleId,
              photoUrls: d.photoUrls || [],
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: userId,
              updatedBy: userId,
              status: 'ACTIVE'
            });
          });
        }

        // Update Vehicle
        t.update(vehicleRef, {
          currentOdometer: endOdometer,
          status: requiresMaintenance ? 'MAINTENANCE' : 'AVAILABLE',
          updatedAt: new Date(),
          updatedBy: userId
        });

        // Update Rental
        t.update(rentalRef, {
          status: 'COMPLETED',
          actualReturnAt: returnDate,
          extraKmCharge,
          lateCharge,
          damageCharges: damageTotal,
          otherCharges: extraOtherCharges,
          totalAmount: finalTotal,
          updatedAt: new Date(),
          updatedBy: userId
        });

        result = returnData;
      });
      return result;
    } catch (e: any) {
      if (e instanceof AppError) throw e;
      throw new AppError(`Return transaction failed: ${e.message}`, 'INTERNAL_SERVER_ERROR', 500);
    }
  }
}
