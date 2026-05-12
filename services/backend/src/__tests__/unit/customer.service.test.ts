import { customerService } from '../../features/customers/customer.service'
import { customerRepository } from '../../features/customers/customer.repository'
import { debtRepository } from '../../features/debts/debt.repository'
import { NotFoundError, BusinessError } from '../../shared/errors'
import { mockCustomer, mockCustomerDTO, mockDebt } from './mocks'



vi.mock(`../../features/customers/customer.repository`)
vi.mock(`../../features/debts/debt.repository`)

describe('CustomerService', () => {
    
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Register', () => {

        it('should register a new customer when dni is no not taken', async () => {
            vi.spyOn(customerRepository, 'getByDni').mockResolvedValue(null)
            vi.spyOn(customerRepository, 'create').mockResolvedValue(mockCustomer)

            const result = await customerService.register(mockCustomerDTO)
            expect(result).toEqual(mockCustomer)
            expect(customerRepository.create).toHaveBeenCalledTimes(1)
        })
        
        it('should throw a BusinessError when dni is already taken', async () => {
            vi.spyOn(customerRepository, 'getByDni').mockResolvedValue(mockCustomer)
            await expect(customerService.register(mockCustomerDTO)).rejects.toThrow(BusinessError)
            expect(customerRepository.create).not.toHaveBeenCalled()
        })
    })

    describe('Search', () => {

        it('should return customers matching the name filter', async () => {
            vi.spyOn(customerRepository, 'getAll').mockResolvedValue([mockCustomer])

            const results = await customerService.search({ name: 'Juan' })

            expect(results).toEqual([mockCustomer])
            expect(customerRepository.getAll).toHaveBeenCalledWith({ name: 'Juan' })
        })

        it('should return an empty array if not a customer match the name filter', async () => {
            vi.spyOn(customerRepository, 'getAll').mockResolvedValue([])
            
            const results = await customerService.search({name: 'Nonexistent' })
            expect(results).toHaveLength(0)
            expect(customerRepository.getAll).toHaveBeenCalledWith({ name: 'Nonexistent' })
        })

        it('should return all customers if no filter is provided', async () => {    
            vi.spyOn(customerRepository, 'getAll').mockResolvedValue([mockCustomer])
            const results = await customerService.search({})
            expect(results).toEqual([mockCustomer])
            expect(customerRepository.getAll).toHaveBeenCalledWith({})
            expect(results).toHaveLength(1)
         })
    })

    describe('getById', () => {
        it('should return customer when exists', async () => {
            vi.spyOn(customerRepository, 'getById').mockResolvedValue(mockCustomer)

            const result = await customerService.getById(1)

            expect(result).toEqual(mockCustomer)
            expect(customerRepository.getById).toHaveBeenCalledWith(1)
        })

        it('should throw NotFoundError when customer does not exist', async () => {
            vi.spyOn(customerRepository, 'getById').mockResolvedValue(null)

            await expect(customerService.getById(999)).rejects.toThrow(NotFoundError)
        })
    })

    describe('delete', () => {
        it('should delete customer when exists and has no debts', async () => {
            vi.spyOn(customerRepository, 'getById').mockResolvedValue(mockCustomer as any)
            vi.spyOn(debtRepository, 'getAll').mockResolvedValue([])
            vi.spyOn(customerRepository, 'softDelete').mockResolvedValue(true)

            await expect(customerService.delete(1)).resolves.not.toThrow()

            expect(customerRepository.softDelete).toHaveBeenCalledWith(1)   
        })

        it('should throw NotFoundError when customer does not exist', async () => {
            vi.spyOn(customerRepository, 'getById').mockResolvedValue(null)

            await expect(customerService.delete(999)).rejects.toThrow(NotFoundError)
        })

        it('should throw BusinessError when customer has active debts', async () => {
            vi.spyOn(customerRepository, 'getById').mockResolvedValue(mockCustomer as any)
            vi.spyOn(debtRepository, 'getAll').mockResolvedValue([mockDebt])

            await expect(customerService.delete(1)).rejects.toThrow(BusinessError)
            expect(customerRepository.softDelete).not.toHaveBeenCalled()
        })
    })
})
    


