import { DebtData } from '@carniceria/shared'
import { Debt } from './models/debt.model'
import { DebtDTO } from './models/debt.dto'
import { DebtPaymentEvent } from './models/debtPaymentEvent.model'
import { RecordDebtPayment } from './models/recordDebtPayment.model'

export interface DebtFilters {
    customer_id?: number
    status?: DebtData['status']
    id?: number
}

export interface DebtPaymentEventFilters {
    debt_id?: number
    close_id?: number
    id?: number
}

export interface IDebtService {
    create(data: DebtDTO): Promise<Debt>
    search(filters?: DebtFilters): Promise<Debt[]>
    recordPayment(id: number, close_id: number, data: RecordDebtPayment): Promise<DebtPaymentEvent | null>
    getPaymentEvents(filters?: DebtPaymentEventFilters): Promise<DebtPaymentEvent[]>
}
