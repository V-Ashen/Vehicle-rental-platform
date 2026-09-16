import { CustomerRepository } from '../repositories/CustomerRepository';
import { generateId, IdPrefix } from '../utils/idGenerator';
import { AppError } from '../utils/AppError';

const customerRepo = new CustomerRepository();

export class CustomerService {
  async createCustomer(tenantId: string, data: any, userId: string) {
    const customerId = generateId(IdPrefix.CUSTOMER);
    return customerRepo.create(customerId, {
      ...data,
      tenantId,
      status: 'ACTIVE',
      createdBy: userId,
      updatedBy: userId
    });
  }

  async getCustomers(tenantId: string, limit: number, startAfterId?: string) {
    return customerRepo.findAllPaginated(limit, startAfterId, 'createdAt', 'desc', [{ field: 'tenantId', operator: '==', value: tenantId }]);
  }

  async getCustomer(id: string, tenantId: string) {
    const customer = await customerRepo.findById(id, tenantId);
    if (!customer || customer.tenantId !== tenantId) {
      throw new AppError('Customer not found', 'NOT_FOUND', 404);
    }
    return customer;
  }

  async updateCustomer(id: string, tenantId: string, data: any, userId: string) {
    const customer = await this.getCustomer(id, tenantId);
    
    return customerRepo.update(id, {
      ...data,
      updatedBy: userId
    }, tenantId);
  }
}
