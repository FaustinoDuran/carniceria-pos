import { debtService } from '../../features/debts/debt.service'
import { debtRepository } from '../../features/debts/debt.repository'
import { withTransaction } from '../../shared/transaction.helper'
import { RecordDebtPayment } from '../../features/debts/models/recordDebtPayment.model'
import {
    createMockDebt,
    createMockDebtForPayment,
    createMockDebtPaymentEvent,
    createMockRecordDebtPayment,
    mockDebt,
    mockDebtDTO,
} from './mocks'

vi.mock('../../features/debts/debt.repository')
vi.mock('../../shared/transaction.helper', () => ({
    withTransaction: vi.fn(),
}))

describe('DebtService', () => {
    const mockClient = {} as any

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(withTransaction).mockImplementation(async (callback: any) => callback(mockClient))
    })

    describe('create', () => {
        it('should create debt through repository', async () => {
            vi.spyOn(debtRepository, 'create').mockResolvedValue(mockDebt)

            const result = await debtService.create(mockDebtDTO)

            expect(result).toEqual(mockDebt)
            expect(debtRepository.create).toHaveBeenCalledTimes(1)
        })
    })

    describe('search', () => {
        it('should delegate search to repository', async () => {
            vi.spyOn(debtRepository, 'getAll').mockResolvedValue([mockDebt])

            const result = await debtService.search({ customer_id: 1 })

            expect(result).toEqual([mockDebt])
            expect(debtRepository.getAll).toHaveBeenCalledWith({ customer_id: 1 })
        })
    })

    describe('recordPayment', () => {
        it('should return null when debt does not exist', async () => {
            vi.spyOn(debtRepository, 'getByIdForUpdate').mockResolvedValue(null)

            const result = await debtService.recordPayment(
                1,
                1,
                createMockRecordDebtPayment(),
            )

            expect(result).toBeNull()
            expect(debtRepository.updatePaymentState).not.toHaveBeenCalled()
            expect(debtRepository.createPaymentEvent).not.toHaveBeenCalled()
        })

        it('should return null when debt is already paid', async () => {
            vi.spyOn(debtRepository, 'getByIdForUpdate').mockResolvedValue(
                createMockDebtForPayment({ amount: 300, status: 'paid' }),
            )

            const result = await debtService.recordPayment(
                1,
                1,
                createMockRecordDebtPayment(),
            )

            expect(result).toBeNull()
            expect(debtRepository.updatePaymentState).not.toHaveBeenCalled()
            expect(debtRepository.createPaymentEvent).not.toHaveBeenCalled()
        })

        it('should return null when paid amount exceeds debt amount', async () => {
            vi.spyOn(debtRepository, 'getByIdForUpdate').mockResolvedValue(
                createMockDebtForPayment({ amount: 300 }),
            )

            const result = await debtService.recordPayment(
                1,
                1,
                createMockRecordDebtPayment({ paid_amount: 500 }),
            )

            expect(result).toBeNull()
            expect(debtRepository.updatePaymentState).not.toHaveBeenCalled()
            expect(debtRepository.createPaymentEvent).not.toHaveBeenCalled()
        })

        it('should apply partial payment and create payment event', async () => {
            const paymentData = createMockRecordDebtPayment({
                paid_amount: 500,
                pay_method: 'debit',
            })

            const updatedDebt = createMockDebt({
                status: 'partial',
                amount: 1000,
                pay_method: 'debit',
                updated_at: new Date(),
            })

            const event = createMockDebtPaymentEvent({
                id: 10,
                close_id: 2,
                paid_amount: 500,
                pay_method: 'debit',
            })

            vi.spyOn(debtRepository, 'getByIdForUpdate').mockResolvedValue(createMockDebtForPayment())
            vi.spyOn(debtRepository, 'updatePaymentState').mockResolvedValue(updatedDebt)
            vi.spyOn(debtRepository, 'createPaymentEvent').mockResolvedValue(event)

            const result = await debtService.recordPayment(1, 2, paymentData)

            expect(result).toEqual(event)
            expect(debtRepository.updatePaymentState).toHaveBeenCalledWith(
                1,
                {
                    amount: 1000,
                    status: 'partial',
                    pay_method: 'debit',
                },
                mockClient,
            )
            expect(debtRepository.createPaymentEvent).toHaveBeenCalledWith(1, 2, expect.any(RecordDebtPayment), mockClient)
        })

        it('should mark debt as paid when payment completes remaining amount', async () => {
            const paymentData = createMockRecordDebtPayment({ paid_amount: 1500 })

            const updatedDebt = createMockDebt({
                status: 'paid',
                amount: 0,
                pay_method: 'cash',
                updated_at: new Date(),
            })

            const event = createMockDebtPaymentEvent({
                id: 11,
                close_id: 2,
                paid_amount: 1500,
                pay_method: 'cash',
            })

            vi.spyOn(debtRepository, 'getByIdForUpdate').mockResolvedValue(createMockDebtForPayment())
            vi.spyOn(debtRepository, 'updatePaymentState').mockResolvedValue(updatedDebt)
            vi.spyOn(debtRepository, 'createPaymentEvent').mockResolvedValue(event)

            const result = await debtService.recordPayment(1, 2, paymentData)

            expect(result).toEqual(event)
            expect(debtRepository.updatePaymentState).toHaveBeenCalledWith(
                1,
                {
                    amount: 0,
                    status: 'paid',
                    pay_method: 'cash',
                },
                mockClient,
            )
        })
    })
})
