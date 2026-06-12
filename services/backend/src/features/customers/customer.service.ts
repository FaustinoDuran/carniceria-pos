import { ICustomerService, CustomerFilters } from './customer.service.interface';
import { Customer } from './models/customer.model';
import { CustomerDTO, UpdateCustomerDTO } from './models/customer.dto';
import { BusinessError, NotFoundError } from '../../shared/errors';
import { customerRepository } from './customer.repository';
import { debtRepository } from '../debts/debt.repository';

export class CustomerService implements ICustomerService {
    async register( data : unknown ) : Promise<Customer> {
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

    async update(id: number, data: unknown): Promise<Customer> {
        const customer = await customerRepository.getById(id)

        if (!customer) {
            throw new NotFoundError('Customer not found')
        }

        const dto = new UpdateCustomerDTO(data)

        if (dto.dni && dto.dni !== customer.dni) {
            const existing = await customerRepository.getByDni(dto.dni)
            if (existing && existing.id !== id) {
                throw new BusinessError('DNI already taken')
            }
        }

        const updated = await customerRepository.update(id, dto)
        if (!updated) {
            throw new BusinessError('Customer could not be updated')
        }

        return updated
    }

    async delete(id: number) {
        const customer = await customerRepository.getById(id)

        if(!customer){
            throw new NotFoundError('Customer not found')
        }
        
        const hasActiveDebts = await debtRepository.hasActiveByCustomer(id)

        if(hasActiveDebts){
            throw new BusinessError('Customer has active debts and cannot be deleted')
        }
        await customerRepository.softDelete(id)
    }

    async restore(id: number): Promise<Customer> {
        const customer = await customerRepository.getByIdIncludingDeleted(id)

        if (!customer) {
            throw new NotFoundError('Customer not found')
        }

        if (customer.deleted_at === null) {
            throw new BusinessError('Customer is not deleted')
        }

        const restored = await customerRepository.restore(id)
        if (!restored) {
            throw new BusinessError('Customer could not be restored')
        }

        return this.getById(id)
    }
}

export const customerService = new CustomerService()
