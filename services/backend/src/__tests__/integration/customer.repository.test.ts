import { CustomerRepository } from '../../features/customers/customer.repository'
import { CustomerDTO } from '../../features/customers/models/customer.dto'

const validCustomerData  = {
  name: 'Juan',
  last_name: 'Pérez',
  phone: '1234567890',
  dni: '12345678'
}

const validCustomerData2  = {
  name: 'Juan 2',
  last_name: 'Pérez 2',
  phone: '0987654321',
  dni: '87654321'
}

describe('CustomerRepository', () => {

    describe('create', () => {
        it('should create a new customer', async () => {
            const data = new CustomerDTO(validCustomerData)
            const customer = await new CustomerRepository().create(data)
            
            expect(customer.id).toBeDefined()
            expect(customer.name).toBe(validCustomerData.name)
            expect(customer.last_name).toBe(validCustomerData.last_name)
            expect(customer.phone).toBe(validCustomerData.phone)
            expect(customer.dni).toBe(validCustomerData.dni)
            expect(customer.created_at).toBeInstanceOf(Date)
            expect(customer.deleted_at).toBeNull()
        })
    })
        describe('getAll', () => {
            
            it('should return all Customers', async () => {
                const data = new CustomerDTO(validCustomerData)
                const data2 = new CustomerDTO(validCustomerData2)
                const repo = new CustomerRepository()

                await repo.create(data)
                await repo.create(data2)
                const getAllResult = await repo.getAll()

                expect(getAllResult.length).toBe(2)
                expect(getAllResult[0].name).toBe(validCustomerData.name)
                expect(getAllResult[0].last_name).toBe(validCustomerData.last_name)
                expect(getAllResult[0].phone).toBe(validCustomerData.phone)
                expect(getAllResult[0].dni).toBe(validCustomerData.dni)
            })

            it('shoul not return deleted customers', async() => {
                const data = new CustomerDTO(validCustomerData)
                const repo = new CustomerRepository()                
                const customer = await repo.create(data)   

                await repo.softDelete(customer.id)
                const getAllResult = await repo.getAll()
                
                expect(getAllResult.length).toBe(0)
            })

            it('should filter by name case insensitive', async () => {
                const data = new CustomerDTO(validCustomerData)

                new CustomerRepository().create(data)

                const results = await new CustomerRepository().getAll({ name: 'jua' })
                expect(results.length).toBe(1)
                expect(results[0].name).toBe(validCustomerData.name)
            })
            
        })


        describe('getById', () => {

            it('should return customer when exists', async () => {
                const created = await new CustomerRepository().create(new CustomerDTO(validCustomerData))
                const found = await new CustomerRepository().getById(created.id)

              expect(found).not.toBeNull()
              expect(found?.id).toBe(created.id)
            })
        
            it('should return null when customer does not exist', async () => {
              const found = await new CustomerRepository().getById(999)
              expect(found).toBeNull()
            })
        
            it('should return null when customer is soft deleted', async () => {
              const customer = await new CustomerRepository().create(new CustomerDTO(validCustomerData))
              await new CustomerRepository().softDelete(customer.id)
            
              const found = await new CustomerRepository().getById(customer.id)
              expect(found).toBeNull()
            })
        })


        describe('softDelete', () => {
            it('should return true when customer exists and is active', async () => {
                const customer = await new CustomerRepository().create(new CustomerDTO(validCustomerData))
                const result = await new CustomerRepository().softDelete(customer.id)

                expect(result).toBe(true)
            })

            it('should return false when customer does not exist', async () => {
                const result = await new CustomerRepository().softDelete(999)
                expect(result).toBe(false)
            })
        })
    })
