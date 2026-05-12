import { ICustomerService, CustomerFilters } from './customer.service.interface';
import { Customer } from './models/customer.model';
import { CustomerDTO } from './models/customer.dto';
import { BusinessError, NotFoundError } from '../../shared/errors';
import { customerRepository } from './customer.repository';
import { debtRepository } from '../debts/debt.repository';

export class CustomerService implements ICustomerService {
    async register( data : CustomerDTO ) : Promise<Customer> {
        const dto = new CustomerDTO(data)

        if (dto.dni){
            const existing = await customerRepository.getByDni(dto.dni)
            if (existing) {
                throw new BusinessError('DNI already taken')
            }
        }
        return await customerRepository.create(dto)
    }

    async search(filters : CustomerFilters) : Promise<Customer[]> {
        return await customerRepository.getAll(filters)
    }
    async getById(id: number) : Promise<Customer> {
        const customer = await customerRepository.getById(id)

        if (!customer) {
            throw new NotFoundError('Customer not found')
        }
        return customer
    }
    async delete(id: number) {
        const customer = await customerRepository.getById(id)

        if(!customer){
            throw new NotFoundError('Customer not found')
        }
        
        const debts = await debtRepository.getAll({ customer_id: id, status: 'pending' })

        if(debts.length > 0 ){
            throw new BusinessError('Customer has pending debts and cannot be deleted')
        }
        await customerRepository.softDelete(id)
    }
}

export const customerService = new CustomerService()
