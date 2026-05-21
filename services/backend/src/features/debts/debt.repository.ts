import { pool } from '../../db'
import { mapToModel } from '../../shared/mappers.helper'
import { DebtData } from '@carniceria/shared'
import { Debt } from './models/debt.model'
import { DebtDTO } from './models/debt.dto'
import { DebtPaymentEvent } from './models/debtPaymentEvent.model'
import { RecordDebtPayment } from './models/recordDebtPayment.model'
import { PoolClient } from 'pg'
import { withTransaction } from '../../shared/transaction.helper'
 
interface DebtFilters {
    customer_id?:number,
    status?: DebtData['status'],
    id?: number
}

interface DebtPaymentEventFilters {
    debt_id?: number
    close_id?: number
    id?: number
}

export class DebtRepository {

    async getAll( filters?:DebtFilters ) : Promise< Debt[] > {
        
        const conditions: string[] = []
        const values: unknown[] = []

        if(filters?.customer_id){
            values.push(filters.customer_id)
            conditions.push(`customer_id = $${values.length}`)
        }

        if(filters?.status) {
            values.push(filters.status)
            conditions.push(`status = $${values.length}`)
        }

        if (filters?.id !== undefined) {
            values.push(filters.id)
            conditions.push(`id = $${values.length}`)
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

        const { rows } = await pool.query(
            `SELECT * FROM debts ${where} ORDER BY created_at DESC`, values
        )
        return rows.map( row => mapToModel( Debt, row))
    }

    async create( data : DebtDTO ): Promise< Debt > {
        const { rows } = await pool.query(
            `INSERT INTO debts (sales_id, customer_id, amount) VALUES ($1, $2, $3) RETURNING *`, 
            [data.sales_id, data.customer_id, data.amount]

        )
        return mapToModel( Debt, rows[0] )
    }

    async recordPayment(id: number, data: RecordDebtPayment, client?: PoolClient): Promise<DebtPaymentEvent | null> {
        const execute = async (queryClient: PoolClient): Promise<DebtPaymentEvent | null> => {
            const { rows: debtRows } = await queryClient.query(
                `SELECT id, amount, status FROM debts WHERE id = $1 FOR UPDATE`,
                [id]
            )

            if (!debtRows.length) {
                return null
            }

            const debt = debtRows[0] as { amount: number; status: DebtData['status'] }

            if (debt.status === 'paid' || data.paid_amount > debt.amount) {
                return null
            }

            const remainingAmount = Number((debt.amount - data.paid_amount).toFixed(2))
            const nextStatus: DebtData['status'] = remainingAmount === 0 ? 'paid' : 'partial'

            const { rows: updatedDebtRows } = await queryClient.query(
                `UPDATE debts
                 SET amount = $1, status = $2, pay_method = $3, updated_at = NOW()
                 WHERE id = $4
                 RETURNING *`,
                [remainingAmount, nextStatus, data.pay_method, id]
            )

            if (!updatedDebtRows.length) {
                return null
            }

            const { rows: eventRows } = await queryClient.query(
                `INSERT INTO debt_payment_events (debt_id, close_id, paid_amount, pay_method)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [id, data.close_id, data.paid_amount, data.pay_method]
            )

            return mapToModel(DebtPaymentEvent, eventRows[0])
        }

        if (client) {
            return execute(client)
        }

        return withTransaction(execute)
    }

    async getPaymentEvents(filters?: DebtPaymentEventFilters, client?: PoolClient): Promise<DebtPaymentEvent[]> {
        const conditions: string[] = []
        const values: unknown[] = []

        if (filters?.id !== undefined) {
            values.push(filters.id)
            conditions.push(`id = $${values.length}`)
        }

        if (filters?.debt_id !== undefined) {
            values.push(filters.debt_id)
            conditions.push(`debt_id = $${values.length}`)
        }

        if (filters?.close_id !== undefined) {
            values.push(filters.close_id)
            conditions.push(`close_id = $${values.length}`)
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

        const executor = client ?? pool
        const { rows } = await executor.query(
            `SELECT * FROM debt_payment_events ${where} ORDER BY created_at DESC`,
            values
        )

        return rows.map((row) => mapToModel(DebtPaymentEvent, row))
    }
    
}

export const debtRepository = new DebtRepository()
