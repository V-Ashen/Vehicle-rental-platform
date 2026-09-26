import { customAlphabet } from 'nanoid';

// Alphabet with only uppercase letters and numbers
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generateRandomStr = customAlphabet(alphabet, 6);

export enum IdPrefix {
  TENANT = 'TEN',
  USER = 'USR',
  ROLE = 'ROL',
  PERMISSION = 'PRM',
  PACKAGE = 'PKG',
  SUBSCRIPTION = 'SUB',
  REQUEST = 'REQ',
  PAYMENT = 'PAY',
  CUSTOMER = 'CUS',
  VEHICLE = 'VEH',
  RENTAL = 'REN',
  HANDOVER = 'HND',
  RETURN = 'RET',
  DAMAGE = 'DMG',
  MAINTENANCE = 'MNT',
  VEHDOC = 'VDC',
  NOTIFICATION = 'NTF',
  PAYMENT_REQUEST = 'PRQ',
  SYSTEM = 'SYS',
}

/**
 * Generates a standard pre-fixed ID
 * @example generateId(IdPrefix.TENANT) // Returns 'TEN-8K4P2M'
 */
export const generateId = (prefix: IdPrefix): string => {
  return `${prefix}-${generateRandomStr()}`;
};
