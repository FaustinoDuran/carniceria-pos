import { saleDetailRepository } from '../../features/sale-details/sale-detail.repository'
import { createTestSale, createTestSaleDetailData, createTestSaleDetails } from '../helpers/createTestData'

describe('SaleDetailRepository', () => {

    describe('createMany', () => {
        it('should create multiple sale details and persist calculated subtotal', async () => {
            const sale = await createTestSale()
            const details = [
                createTestSaleDetailData({ cut_name: 'Asado', price_per_kg: 12.5, weight_kg: 2 }),
                createTestSaleDetailData({ cut_name: 'Vacio', price_per_kg: 6.9, weight_kg: 2 })
            ]

            const created = await saleDetailRepository.createMany(sale.id, details)

            expect(created).toHaveLength(2)
            expect(created[0].sale_id).toBe(sale.id)
            expect(created[1].sale_id).toBe(sale.id)
            expect(created[0].subtotal).toBe(25)
            expect(created[1].subtotal).toBe(13.8)
            expect(created[0].created_at).toBeInstanceOf(Date)
            expect(created[1].created_at).toBeInstanceOf(Date)
        })

        it('should calculate subtotal with 2 decimal precision', async () => {
            const sale = await createTestSale()
            const details = [
                createTestSaleDetailData({ cut_name: 'Bife', price_per_kg: 17.35, weight_kg: 1.25 })
            ]

            const created = await saleDetailRepository.createMany(sale.id, details)

            expect(created).toHaveLength(1)
            expect(created[0].subtotal).toBe(21.69)
        })
    })

    describe('getBySaleId', () => {
        it('should return details only for the requested sale', async () => {
            const saleOne = await createTestSale()
            const saleTwo = await createTestSale()

            await createTestSaleDetails(saleOne.id, [
                { cut_name: 'Milanesa', price_per_kg: 8.5, weight_kg: 2 },
                { cut_name: 'Picada', price_per_kg: 5, weight_kg: 1.5 },
            ])

            await createTestSaleDetails(saleTwo.id, [
                { cut_name: 'Tapa de asado', price_per_kg: 9, weight_kg: 2 },
            ])

            const saleOneDetails = await saleDetailRepository.getBySaleId(saleOne.id)

            expect(saleOneDetails).toHaveLength(2)
            expect(saleOneDetails.every((detail) => detail.sale_id === saleOne.id)).toBe(true)
        })

        it('should return empty array when sale has no details', async () => {
            const sale = await createTestSale()

            const details = await saleDetailRepository.getBySaleId(sale.id)

            expect(details).toHaveLength(0)
        })
    })

})
