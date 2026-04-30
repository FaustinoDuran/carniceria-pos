import { saleRepository } from '../../features/sales/sale.repository'
import { createTestSale, createCloseTestData } from '../helpers/createTestData'

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
                const close = await createCloseTestData( [sale.id] , [])
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
                const close = await createCloseTestData( [sale.id] , [])

                const result = await saleRepository.setClosed( close.id , [sale.id] )
                const sales = await saleRepository.getAll({ close_id: close.id })

                expect(result).toBe(true)
                expect(sales).toHaveLength(1)
                expect(sales[0].close_id).toBe(close.id)
            })


        })
    })    
})