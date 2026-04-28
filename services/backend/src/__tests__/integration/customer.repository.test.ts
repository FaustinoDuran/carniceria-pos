import { customerRepository } from '../../features/customers/customer.repository'
import { createTestCustomer } from '../helpers/createTestData'

const validCustomerData  = {
  name: 'Pepe',
  last_name: 'Gonzales',
  phone: '1234567890',
  dni: '12345678'
}

describe('CustomerRepository', () => {

    describe('create', () => {
        it('should create a new customer', async () => {
            
            const customer = await createTestCustomer()
        
            expect(customer.id).toBeDefined()
            expect(customer.name).toBe('Juan')
            expect(customer.last_name).toBe('Pérez')
            expect(customer.phone).toBe('1234567890')
            expect(customer.dni).toBe('12345678')
            expect(customer.created_at).toBeInstanceOf(Date)
            expect(customer.deleted_at).toBeNull()
        })
    })
        describe('getAll', () => {
            
            it('should return all Customers', async () => {
                await createTestCustomer()
                await createTestCustomer(validCustomerData)

                const getAllResult = await customerRepository.getAll()

                expect(getAllResult.length).toBe(2)
                expect(getAllResult[1].name).toBe(validCustomerData.name)
                expect(getAllResult[1].last_name).toBe(validCustomerData.last_name)
                expect(getAllResult[1].phone).toBe(validCustomerData.phone)
                expect(getAllResult[1].dni).toBe(validCustomerData.dni)
            })

            it('shoul not return deleted customers', async() => {
               const customer = await createTestCustomer()   

                await customerRepository.softDelete(customer.id)
                const getAllResult = await customerRepository.getAll()
                
                expect(getAllResult.length).toBe(0)
            })

            it('should filter by name case insensitive', async () => {
                await createTestCustomer()

                const results = await customerRepository.getAll({ name: 'jua' })
                expect(results.length).toBe(1)
                expect(results[0].name).toBe('Juan')
            })
            
        })


        describe('getById', () => {

            it('should return customer when exists', async () => {
                const created = await createTestCustomer()
                const found = await customerRepository.getById(created.id)

              expect(found).not.toBeNull()
              expect(found?.id).toBe(created.id)
            })
        
            it('should return null when customer does not exist', async () => {
              const found = await customerRepository.getById(999)
              expect(found).toBeNull()
            })
        
            it('should return null when customer is soft deleted', async () => {
              const customer = await createTestCustomer()
              await customerRepository.softDelete(customer.id)
            
              const found = await customerRepository.getById(customer.id)
              expect(found).toBeNull()
            })
        })


        describe('softDelete', () => {
            it('should return true when customer exists and is active', async () => {
                const customer = await createTestCustomer()
                const result = await customerRepository.softDelete(customer.id)

                expect(result).toBe(true)
            })

            it('should return false when customer does not exist', async () => {
                const result = await customerRepository.softDelete(999)
                expect(result).toBe(false)
            })
        })
    })
