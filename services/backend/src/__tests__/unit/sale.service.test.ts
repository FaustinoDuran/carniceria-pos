import { saleService } from '../../features/sales/sale.service'
import { saleRepository } from '../../features/sales/sale.repository'
import { saleDetailRepository } from '../../features/sale-details/sale-detail.repository'
import { debtService } from '../../features/debts/debt.service'
import { debtRepository } from '../../features/debts/debt.repository'
import { closeService } from '../../features/closes/close.service'
import { withTransaction } from '../../shared/transaction.helper'
import { SaleDTO, UpdateSaleDTO } from '../../features/sales/models/sale.dto'
import { createMockSale, mockSaleDTO, mockUpdateSaleDTO, createMockCloseOpening, createMockSaleDetail, createMockDebtPaymentEvent } from './mocks'
import { BusinessError, NotFoundError } from '../../shared/errors'
import { mockDebt } from './mocks'

vi.mock('../../features/sales/sale.repository')
vi.mock('../../features/sale-details/sale-detail.repository')
vi.mock('../../features/debts/debt.service')
vi.mock('../../features/debts/debt.repository')
vi.mock('../../features/closes/close.service')
vi.mock('../../shared/transaction.helper', () => ({
    withTransaction: vi.fn(),
}))

describe('SaleService', () => {
    const mockClient = {} as any

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(withTransaction).mockImplementation(async (callback: any) => callback(mockClient))
    })

    describe('create', () => {
        it('should create a new sale and persist details when provided', async () => {
            const sale = createMockSale({ id: 1, pay_method: 'cash' })
            vi.mocked(saleRepository.create).mockResolvedValue(sale)
            vi.mocked(saleDetailRepository.createMany).mockResolvedValue([])

            const result = await saleService.create(mockSaleDTO, [
                { cut_name: 'Asado', price_per_kg: 10, weight_kg: 2 },
            ])

            expect(result).toBe(sale)
            expect(saleRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ amount_meat: 20, amount_merchandise: 50, pay_method: 'cash' }),
                mockClient,
            )
            expect(saleDetailRepository.createMany).toHaveBeenCalledWith(
                sale.id,
                expect.any(Array),
                mockClient,
            )
        })

        it('should create debt for cc sales when customer_id is provided', async () => {
            const sale = createMockSale({ id: 1, pay_method: 'cc', amount_meat: 0, amount_merchandise: 0 })
            vi.mocked(saleRepository.create).mockResolvedValue(sale)
            vi.mocked(saleDetailRepository.createMany).mockResolvedValue([])
            vi.mocked(debtService.create).mockResolvedValue(mockDebt)

            const ccSaleDto = new SaleDTO({ amount_meat: 10, amount_merchandise: 5, pay_method: 'cc' })
            const result = await saleService.create(ccSaleDto, undefined, 1)

            expect(result).toBe(sale)
            expect(debtService.create).toHaveBeenCalledTimes(1)
            expect(vi.mocked(debtService.create).mock.calls[0][1]).toBe(mockClient)
            expect(vi.mocked(debtService.create).mock.calls[0][0]).toMatchObject({
                sales_id: sale.id,
                customer_id: 1,
                amount: 15,
            })
        })

        it('should throw when cc sale is created without customer_id', async () => {
            const ccSaleDto = new SaleDTO({ amount_meat: 0, amount_merchandise: 0, pay_method: 'cc' })

            await expect(saleService.create(ccSaleDto)).rejects.toThrow(BusinessError)
            expect(saleRepository.create).not.toHaveBeenCalled()
        })

        it('should automatically open a new close when no active close exists', async () => {
            const mockClose = createMockCloseOpening()
            const sale = createMockSale({ id: 1, pay_method: 'cash' })
            
            vi.mocked(closeService.getActive).mockResolvedValue(null)
            vi.mocked(closeService.start).mockResolvedValue(mockClose)
            vi.mocked(saleRepository.create).mockResolvedValue(sale)
            vi.mocked(saleDetailRepository.createMany).mockResolvedValue([])

            const result = await saleService.create(mockSaleDTO)

            expect(closeService.getActive).toHaveBeenCalledTimes(1)
            expect(closeService.start).toHaveBeenCalledTimes(1)
            expect(result).toBe(sale)
        })

        it('should use existing active close when one is already open', async () => {
            const mockClose = createMockCloseOpening()
            const sale = createMockSale({ id: 1, pay_method: 'cash' })
            
            vi.mocked(closeService.getActive).mockResolvedValue(mockClose)
            vi.mocked(saleRepository.create).mockResolvedValue(sale)
            vi.mocked(saleDetailRepository.createMany).mockResolvedValue([])

            const result = await saleService.create(mockSaleDTO)

            expect(closeService.getActive).toHaveBeenCalledTimes(1)
            expect(closeService.start).not.toHaveBeenCalled()
            expect(result).toBe(sale)
        })
    })

    describe('update', () => {
        it('should update a sale and replace details when provided', async () => {
            const sale = createMockSale({ id: 1, pay_method: 'cash', amount_meat: 100, amount_merchandise: 50, close_id: null })
            const updatedSale = createMockSale({ id: 1, pay_method: 'cash', amount_meat: 20, amount_merchandise: 50, close_id: null })

            vi.mocked(saleRepository.getById).mockResolvedValue(sale)
            vi.mocked(debtRepository.hasBySaleId).mockResolvedValue(false)
            vi.mocked(saleRepository.update).mockResolvedValue(updatedSale)
            vi.mocked(saleDetailRepository.deleteBySaleId).mockResolvedValue(undefined)
            vi.mocked(saleDetailRepository.createMany).mockResolvedValue([])

            const result = await saleService.update(
                1,
                new UpdateSaleDTO({}),
                [{ cut_name: 'Asado', price_per_kg: 10, weight_kg: 2 }],
            )

            expect(result).toBe(updatedSale)
            expect(saleRepository.update).toHaveBeenCalledWith(1, { amount_meat: 20 }, mockClient)
            expect(saleDetailRepository.deleteBySaleId).toHaveBeenCalledWith(1, mockClient)
            expect(saleDetailRepository.createMany).toHaveBeenCalledWith(1, expect.any(Array), mockClient)
        })

        it('should create debt when sale pay_method changes to cc', async () => {
            const sale = createMockSale({ id: 1, pay_method: 'cash', amount_meat: 100, amount_merchandise: 50, close_id: null })
            const updatedSale = createMockSale({ id: 1, pay_method: 'cc', amount_meat: 100, amount_merchandise: 50, close_id: null })

            vi.mocked(saleRepository.getById).mockResolvedValue(sale)
            vi.mocked(debtRepository.hasBySaleId).mockResolvedValue(false)
            vi.mocked(saleRepository.update).mockResolvedValue(updatedSale)
            vi.mocked(debtService.create).mockResolvedValue(mockDebt)

            const result = await saleService.update(
                1,
                new UpdateSaleDTO({ pay_method: 'cc' }),
                undefined,
                2,
            )

            expect(result).toBe(updatedSale)
            expect(debtService.create).toHaveBeenCalledTimes(1)
            expect(vi.mocked(debtService.create).mock.calls[0][0]).toMatchObject({
                sales_id: 1,
                customer_id: 2,
                amount: 150,
            })
        })

        it('should throw NotFoundError when sale does not exist', async () => {
            vi.mocked(saleRepository.getById).mockResolvedValue(null)

            await expect(saleService.update(1, mockUpdateSaleDTO)).rejects.toThrow(NotFoundError)
        })

        it('should throw BusinessError when sale is closed', async () => {
            const sale = createMockSale({ id: 1, close_id: 2 })
            vi.mocked(saleRepository.getById).mockResolvedValue(sale)

            await expect(saleService.update(1, mockUpdateSaleDTO)).rejects.toThrow(BusinessError)
        })

        it('should throw BusinessError when updating a sale with current account debt', async () => {
            const sale = createMockSale({ id: 1, pay_method: 'cc', close_id: null })
            vi.mocked(saleRepository.getById).mockResolvedValue(sale)
            vi.mocked(debtRepository.hasBySaleId).mockResolvedValue(true)

            await expect(saleService.update(1, mockUpdateSaleDTO)).rejects.toThrow(BusinessError)
            expect(saleRepository.update).not.toHaveBeenCalled()
        })
    })

    describe('search', () => {
        it('should delegate search to repository', async () => {
            const sale = createMockSale()
            vi.mocked(saleRepository.getAll).mockResolvedValue([sale])

            const result = await saleService.search({ pay_method: 'cash' })

            expect(result).toEqual([sale])
            expect(saleRepository.getAll).toHaveBeenCalledWith({ pay_method: 'cash' })
        })
    })

    describe('getById', () => {
        it('should return sale when found', async () => {
            const sale = createMockSale({ id: 1 })
            vi.mocked(saleRepository.getById).mockResolvedValue(sale)

            const result = await saleService.getById(1)

            expect(result).toBe(sale)
        })

        it('should throw NotFoundError when sale does not exist', async () => {
            vi.mocked(saleRepository.getById).mockResolvedValue(null)

            await expect(saleService.getById(1)).rejects.toThrow(NotFoundError)
        })
    })

    describe('getRemitoData', () => {
        it('should return sale, details and customer data for remito printing', async () => {
            const sale = createMockSale({ id: 1 })
            const details = [createMockSaleDetail({ sale_id: 1 })]
            const customer = { id: 9, name: 'Ana', last_name: 'Lopez' }

            vi.mocked(saleRepository.getById).mockResolvedValue(sale)
            vi.mocked(saleDetailRepository.getBySaleId).mockResolvedValue(details)
            vi.mocked(debtRepository.getCustomerBySaleId).mockResolvedValue(customer)

            const result = await saleService.getRemitoData(1)

            expect(result).toEqual({ sale, details, customer })
            expect(saleRepository.getById).toHaveBeenCalledWith(1)
            expect(saleDetailRepository.getBySaleId).toHaveBeenCalledWith(1)
            expect(debtRepository.getCustomerBySaleId).toHaveBeenCalledWith(1)
        })

        it('should return null customer when sale is not linked to a current account debt', async () => {
            const sale = createMockSale({ id: 1 })
            const details = [createMockSaleDetail({ sale_id: 1 })]

            vi.mocked(saleRepository.getById).mockResolvedValue(sale)
            vi.mocked(saleDetailRepository.getBySaleId).mockResolvedValue(details)
            vi.mocked(debtRepository.getCustomerBySaleId).mockResolvedValue(null)

            const result = await saleService.getRemitoData(1)

            expect(result.customer).toBeNull()
        })

        it('should throw NotFoundError when sale does not exist for remito printing', async () => {
            vi.mocked(saleRepository.getById).mockResolvedValue(null)

            await expect(saleService.getRemitoData(1)).rejects.toThrow(NotFoundError)
            expect(saleDetailRepository.getBySaleId).not.toHaveBeenCalled()
        })

        it('should throw BusinessError when sale has no details', async () => {
            const sale = createMockSale({ id: 1 })
            vi.mocked(saleRepository.getById).mockResolvedValue(sale)
            vi.mocked(saleDetailRepository.getBySaleId).mockResolvedValue([])

            await expect(saleService.getRemitoData(1)).rejects.toThrow(BusinessError)
            expect(debtRepository.getCustomerBySaleId).not.toHaveBeenCalled()
        })
    })

    describe('delete', () => {
        it('should delete an open sale', async () => {
            const sale = createMockSale({ id: 1, close_id: null })
            vi.mocked(saleRepository.getById).mockResolvedValue(sale)
            vi.mocked(debtRepository.getBySaleIdForUpdate).mockResolvedValue(null)
            vi.mocked(saleRepository.delete).mockResolvedValue(true)

            await saleService.delete(1)

            expect(debtRepository.getBySaleIdForUpdate).toHaveBeenCalledWith(1, mockClient)
            expect(saleRepository.delete).toHaveBeenCalledWith(1, mockClient)
        })

        it('should delete an open current account sale when the related debt has no payments', async () => {
            const sale = createMockSale({ id: 1, close_id: null, pay_method: 'cc' })
            vi.mocked(saleRepository.getById).mockResolvedValue(sale)
            vi.mocked(debtRepository.getBySaleIdForUpdate).mockResolvedValue({ id: 10 })
            vi.mocked(debtRepository.getPaymentEvents).mockResolvedValue([])
            vi.mocked(debtRepository.delete).mockResolvedValue(true)
            vi.mocked(saleRepository.delete).mockResolvedValue(true)

            await saleService.delete(1)

            expect(debtRepository.getPaymentEvents).toHaveBeenCalledWith({ debt_id: 10 }, mockClient)
            expect(debtRepository.delete).toHaveBeenCalledWith(10, mockClient)
            expect(saleRepository.delete).toHaveBeenCalledWith(1, mockClient)
        })

        it('should throw BusinessError when deleting a sale with recorded debt payments', async () => {
            const sale = createMockSale({ id: 1, close_id: null, pay_method: 'cc' })
            vi.mocked(saleRepository.getById).mockResolvedValue(sale)
            vi.mocked(debtRepository.getBySaleIdForUpdate).mockResolvedValue({ id: 10 })
            vi.mocked(debtRepository.getPaymentEvents).mockResolvedValue([createMockDebtPaymentEvent({ debt_id: 10 })])

            await expect(saleService.delete(1)).rejects.toThrow(BusinessError)
            expect(debtRepository.delete).not.toHaveBeenCalled()
            expect(saleRepository.delete).not.toHaveBeenCalled()
        })

        it('should throw BusinessError when deleting a closed sale', async () => {
            const sale = createMockSale({ id: 1, close_id: 2 })
            vi.mocked(saleRepository.getById).mockResolvedValue(sale)

            await expect(saleService.delete(1)).rejects.toThrow(BusinessError)
            expect(saleRepository.delete).not.toHaveBeenCalled()
        })
    })
})
