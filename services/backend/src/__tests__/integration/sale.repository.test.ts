import { saleRepository } from '../../features/sales/sale.repository'
import { createTestSale, createTestClose } from '../helpers/createTestData'

describe('SaleRepository', () => {

    describe('create', () => {
        it('should create a new sale', async () => {
            const sale = await createTestSale()

            expect(sale).toHaveProperty('id')
            expect(sale.amount_meat).toBe(1000)
            expect(sale.amount_merchandise).toBe(500)
            expect(sale.pay_method).toBe('cc')
        })
    })

    describe('getAll', () => {
        it('should return all sales', async () => {

            await createTestSale()

            const sales = await saleRepository.getAll()
            expect(sales).toHaveLength(1)
        })

        it('should return sales filtered by id', async () => {
            const sale = await createTestSale()
            await createTestSale()

            const salesReturned = await saleRepository.getAll({ id: sale.id })

            expect(salesReturned.length).toBe(1)
            expect(sale.id).toBe(salesReturned[0].id)
        })

        it('should return sales filtered by pay_method', async () => {
            await createTestSale()
            await createTestSale({ pay_method: 'cash' })

            const salesReturned = await saleRepository.getAll({ pay_method: 'cash' })
            const totalSales = await saleRepository.getAll()

            expect(salesReturned.length).toBe(1)
            expect(totalSales.length).toBe(2)
            expect(salesReturned[0].pay_method).toBe('cash')
        })

        it('should return sales filtered by created_at', async () => {
            const sale = await createTestSale()

            const salesReturned = await saleRepository.getAll({ date: sale.created_at })
            const totalSales = await saleRepository.getAll()

            expect(salesReturned.length).toBe(1)
            expect(totalSales.length).toBe(1)
            expect(salesReturned[0].id).toBe(sale.id)
        })

        describe('delete', () => {
            it('should delete a sale', async () => {
                const sale = await createTestSale()

                const deleted = await saleRepository.delete(sale.id)
                const sales = await saleRepository.getAll()

                expect(deleted).toBe(true)
                expect(sales).toHaveLength(0)
            })

            it('should not delete a closed sale', async () => {
                const sale = await createTestSale() 
                const close = await createTestClose()
                await saleRepository.setClosed( close.id , [sale.id] )
                
                const deleted = await saleRepository.delete(sale.id)
                const sales = await saleRepository.getAll()

                expect(deleted).toBe(false)
                expect(sales).toHaveLength(1)
            })
        })

        describe('setClosed', () => {
            it('should set sales as closed', async () => {
                const sale = await createTestSale() 
                await createTestSale()
                const close = await createTestClose()

                const result = await saleRepository.setClosed( close.id , [sale.id] )
                const sales = await saleRepository.getAll({ close_id: close.id })

                expect(result).toBe(true)
                expect(sales).toHaveLength(1)
                expect(sales[0].close_id).toBe(close.id)
            })
        })

        describe('update', () => {
            it('should update sale amount_meat', async () => {
                const sale = await createTestSale()

                const updated = await saleRepository.update(sale.id, { amount_meat: 2000 })

                expect(updated).not.toBeNull()
                expect(updated?.amount_meat).toBe(2000)
                expect(updated?.amount_merchandise).toBe(500)
            })

            it('should update sale amount_merchandise', async () => {
                const sale = await createTestSale()

                const updated = await saleRepository.update(sale.id, { amount_merchandise: 750 })

                expect(updated).not.toBeNull()
                expect(updated?.amount_merchandise).toBe(750)
                expect(updated?.amount_meat).toBe(1000)
            })

            it('should update sale pay_method', async () => {
                const sale = await createTestSale()

                const updated = await saleRepository.update(sale.id, { pay_method: 'cash' })

                expect(updated).not.toBeNull()
                expect(updated?.pay_method).toBe('cash')
            })

            it('should update multiple sale fields at once', async () => {
                const sale = await createTestSale()

                const updated = await saleRepository.update(sale.id, { 
                    amount_meat: 1500,
                    amount_merchandise: 1000,
                    pay_method: 'transfer'
                })

                expect(updated).not.toBeNull()
                expect(updated?.amount_meat).toBe(1500)
                expect(updated?.amount_merchandise).toBe(1000)
                expect(updated?.pay_method).toBe('transfer')
            })

            it('should not update a closed sale', async () => {
                const sale = await createTestSale()
                const close = await createTestClose()

                await saleRepository.setClosed(close.id, [sale.id])

                const updated = await saleRepository.update(sale.id, { amount_meat: 2000 })

                expect(updated).toBeNull()
            })

            it('should return null when no fields are provided for update', async () => {
                const sale = await createTestSale()

                const updated = await saleRepository.update(sale.id, {})

                expect(updated).toBeNull()
            })
        })
    })    
})