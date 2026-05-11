import { ICustomerService } from './customer.service.interface';
import { Customer } from './models/customer.model';

export class CustomerService implements ICustomerService {
    async register( data : unknown ) : Promise<Customer> {
        throw new Error('Method not implemented.');
    }
    async search(filters : any) : Promise<Customer[]> {
        throw new Error('Method not implemented.');
    }
    async getById(id: number) : Promise<Customer> {
        throw new Error('Method not implemented.');
    }
    async delete(id: number) {
        throw new Error('Method not implemented.');
    }
}

export const customerService = new CustomerService()
