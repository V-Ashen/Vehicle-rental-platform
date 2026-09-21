export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  status: string;
}

export interface Tenant extends BaseEntity {
  businessName: string;
  ownerUserId: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  ownerNic?: string;
  brNumber?: string;
  logoUrl?: string;
  profileStatus: 'INCOMPLETE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
  
  // Rental Rules Settings
  gracePeriodMinutes?: number;
  hourlyLateCharge?: number;
  defaultIncludedKmPerDay?: number;
}

export interface User extends BaseEntity {
  firebaseUid: string;
  tenantId: string;
  name: string;
  email: string;
  roleId: string;
  userType: 'SAAS_ADMIN' | 'OWNER' | 'STAFF';
  status: 'ACTIVE' | 'INVITED' | 'DISABLED';
}

export interface Role extends BaseEntity {
  tenantId: string | null;
  name: string;
  roleType: 'SYSTEM' | 'CUSTOM';
  permissions: string[]; // Array of Permission IDs
}

export interface Permission extends BaseEntity {
  code: string;
  module: string;
  action: string;
  description: string;
}

export interface Package extends BaseEntity {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
  maxVehicles: number;
  maxUsers: number;
  features: Record<string, any>;
}

export interface Subscription extends BaseEntity {
  tenantId: string;
  packageId: string;
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  trialStartAt: Date;
  trialEndAt: Date;
}

export interface PaymentRequest extends BaseEntity {
  tenantId: string;
  subscriptionId: string;
  packageId: string;
  amount: number;
  currency: string;
  method: string;
  slipUrl: string;
  submittedAt: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
}

export interface Payment extends BaseEntity {
  tenantId: string | null;
  paymentType: 'SUBSCRIPTION' | 'RENTAL' | 'DEPOSIT' | 'OTHER';
  referenceId: string;
  amount: number;
  currency: string;
  method: 'CASH' | 'CARD' | 'BANK' | 'ONLINE';
  provider: string | null;
  providerTransactionId: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  paidAt: Date | null;
}

export interface Customer extends BaseEntity {
  tenantId: string;
  fullName: string;
  mobile: string;
  email?: string;
  nicPassport: string;
  drivingLicence: string;
  address: string;
}

export interface Vehicle extends BaseEntity {
  tenantId: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  vehicleType: string;
  currentOdometer: number;
  status: 'AVAILABLE' | 'RESERVED' | 'ON_RENT' | 'MAINTENANCE' | 'INACTIVE';
  
  // Pricing
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  extraKmRate: number;
  includedKmPerDay: number;
  depositAmount: number;
  
  // Details
  transmission?: 'AUTO' | 'MANUAL';
  fuelType?: string;
  seats?: number;
  colour?: string;
  imageUrl?: string;
}

export interface Rental extends BaseEntity {
  tenantId: string;
  customerId: string;
  vehicleId: string;
  pickupAt: Date;
  expectedReturnAt: Date;
  actualReturnAt: Date | null;
  rentalDays: number;
  
  // Snapshotted Financials
  dailyRateSnapshot: number;
  extraKmRateSnapshot: number;
  includedKmSnapshot: number;
  
  baseRentalAmount: number;
  extraKmCharge: number;
  lateCharge: number;
  damageCharges: number;
  otherCharges: number;
  totalAmount: number;
  
  status: 'RESERVED' | 'ON_RENT' | 'COMPLETED' | 'CANCELLED';
}

export interface RentalHandover extends BaseEntity {
  tenantId: string;
  rentalId: string;
  vehicleId: string;
  type: 'PICKUP' | 'RETURN';
  odometer: number;
  fuelLevel: string; // e.g. "FULL", "HALF", "EMPTY"
  conditionStatus: 'GOOD' | 'DAMAGED';
  photoUrls: string[];
  notes?: string;
}

export interface RentalReturn extends BaseEntity {
  tenantId: string;
  rentalId: string;
  vehicleId: string;
  actualReturnAt: Date;
  endOdometer: number;
  usedKm: number;
  extraKm: number;
  lateMinutes: number;
  billableLateMinutes: number;
  baseRentalAmount: number;
  extraKmCharge: number;
  lateCharge: number;
  damageTotal: number;
  otherCharges: number;
  finalTotal: number;
}

export interface RentalDamage extends BaseEntity {
  tenantId: string;
  rentalId: string;
  vehicleId: string;
  damageArea: string;
  damageType: string;
  description: string;
  estimatedCost: number;
  photoUrls: string[];
}

export interface MaintenanceRecord extends BaseEntity {
  tenantId: string;
  vehicleId: string;
  maintenanceType: 'SERVICE' | 'REPAIR' | 'INSPECTION';
  description: string;
  serviceDate: Date;
  odometer: number;
  cost: number;
  nextServiceDate?: Date;
  nextServiceOdometer?: number;
}

export interface VehicleDocument extends BaseEntity {
  tenantId: string;
  vehicleId: string;
  documentType: 'INSURANCE' | 'REVENUE' | 'EMISSION' | 'OTHER';
  documentNumber: string;
  issueDate: Date;
  expiryDate: Date;
  fileUrl: string;
  status: 'ACTIVE' | 'EXPIRED';
}

export interface Notification extends BaseEntity {
  tenantId: string;
  userId: string;
  type: string;
  channel: 'EMAIL' | 'SMS';
  subject: string;
  message: string;
  status: 'QUEUED' | 'SENT' | 'FAILED';
}
