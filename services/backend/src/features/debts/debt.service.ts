import { DebtData } from '@carniceria/shared'
import { withTransaction } from '../../shared/transaction.helper'
import { debtRepository } from './debt.repository'
import { DebtFilters, DebtPaymentEventFilters, IDebtService } from './debt.service.interface'
import { Debt } from './models/debt.model'
import { DebtDTO } from './models/debt.dto'
import { DebtPaymentEvent } from './models/debtPaymentEvent.model'
import { RecordDebtPayment } from './models/recordDebtPayment.model'

export class DebtService implements IDebtService {
    async create(data: DebtDTO): Promise<Debt> {
        const dto = new DebtDTO(data)
        return debtRepository.create(dto)
    }

    async search(filters?: DebtFilters): Promise<Debt[]> {
        return debtRepository.getAll(filters)
    }

    async recordPayment(id: number, close_id: number, data: RecordDebtPayment): Promise<DebtPaymentEvent | null> {
        const paymentData = new RecordDebtPayment(data)

        return withTransaction(async (client) => {
            const debt = await debtRepository.getByIdForUpdate(id, client)
            if (!debt) {
                return null
            }

            if (debt.status === 'paid' || paymentData.paid_amount > debt.amount) {
                return null
            }

            const remainingAmount = Number((debt.amount - paymentData.paid_amount).toFixed(2))
            const nextStatus: DebtData['status'] = remainingAmount === 0 ? 'paid' : 'partial'

            const updatedDebt = await debtRepository.updatePaymentState(
                id,
                {
                    amount: remainingAmount,
                    status: nextStatus,
                    pay_method: paymentData.pay_method,
                },
                client,
            )

            if (!updatedDebt) {
                return null
            }

            return debtRepository.createPaymentEvent(id, close_id, paymentData, client)
        })
    }

    async getPaymentEvents(filters?: DebtPaymentEventFilters): Promise<DebtPaymentEvent[]> {
        return debtRepository.getPaymentEvents(filters)
    }
}

export const debtService = new DebtService()
