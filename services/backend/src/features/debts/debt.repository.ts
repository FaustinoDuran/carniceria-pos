import { pool } from '../../db'
import { mapToModel } from '../../shared/mappers.helper'
import { DebtData } from '@carniceria/shared'
import { Debt } from './models/debt.model'
import { DebtDTO } from './models/debt.dto'
import { DebtPaymentEvent } from './models/debtPaymentEvent.model'
import { RecordDebtPayment } from './models/recordDebtPayment.model'
import { PoolClient } from 'pg'
import type { CloseReportGeneratedDebt, CloseReportPaidDebt } from '../closes/types'
 
interface DebtFilters {
    customer_id?:number,
    status?: DebtData['status'],
    id?: number
    close_id?: number
}

interface DebtPaymentEventFilters {
    debt_id?: number
    close_id?: number
    id?: number
}

interface DebtForPayment {
    id: number
    amount: number
    status: DebtData['status']
}

interface DebtForSaleDeletion {
    id: number
}

interface DebtPaymentUpdateData {
    amount: number
    status: DebtData['status']
    pay_method: DebtData['pay_method']
}

interface DebtSaleCustomer {
    id: number
    name: string
    last_name: string
}

export class DebtRepository {

    async getAll( filters?:DebtFilters ) : Promise< Debt[] > {
        
        const conditions: string[] = []
        const values: unknown[] = []

        if(filters?.customer_id){
            values.push(filters.customer_id)
            conditions.push(`debts.customer_id = $${values.length}`)
        }

        if(filters?.status) {
            values.push(filters.status)
            conditions.push(`debts.status = $${values.length}`)
        }

        if (filters?.id !== undefined) {
            values.push(filters.id)
            conditions.push(`debts.id = $${values.length}`)
        }

        if (filters?.close_id !== undefined) {
            values.push(filters.close_id)
            conditions.push(`sales.close_id = $${values.length}`)
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
        const join = filters?.close_id !== undefined ? 'INNER JOIN sales ON sales.id = debts.sales_id' : ''

        const { rows } = await pool.query(
            `SELECT debts.* FROM debts ${join} ${where} ORDER BY debts.created_at DESC`, values
        )
        return rows.map( row => mapToModel( Debt, row))
    }

    async getGeneratedForCloseReport(close_id: number): Promise<CloseReportGeneratedDebt[]> {
        const { rows } = await pool.query(
            `SELECT
                debts.*,
                CONCAT_WS(' ', customers.name, customers.last_name) AS customer_name
             FROM debts
             INNER JOIN sales ON sales.id = debts.sales_id
             INNER JOIN customers ON customers.id = debts.customer_id
             WHERE sales.close_id = $1
             ORDER BY debts.created_at DESC`,
            [close_id],
        )

        return rows as CloseReportGeneratedDebt[]
    }

    async getPaidForCloseReport(close_id: number): Promise<CloseReportPaidDebt[]> {
        const { rows } = await pool.query(
            `SELECT
                debt_payment_events.*,
                debts.customer_id,
                CONCAT_WS(' ', customers.name, customers.last_name) AS customer_name
             FROM debt_payment_events
             INNER JOIN debts ON debts.id = debt_payment_events.debt_id
             INNER JOIN customers ON customers.id = debts.customer_id
             WHERE debt_payment_events.close_id = $1
             ORDER BY debt_payment_events.created_at DESC`,
            [close_id],
        )

        return rows as CloseReportPaidDebt[]
    }

    async getById(id: number): Promise<Debt | null> {
        const debts = await this.getAll({ id })
        return debts.length ? debts[0] : null
    }

    async hasActiveByCustomer(customer_id: number): Promise<boolean> {
        const { rowCount } = await pool.query(
            `SELECT 1
             FROM debts
             WHERE customer_id = $1 AND status <> 'paid'
             LIMIT 1`,
            [customer_id],
        )

        return (rowCount ?? 0) > 0
    }

    async hasBySaleId(sales_id: number): Promise<boolean> {
        const { rowCount } = await pool.query(
            `SELECT 1
             FROM debts
             WHERE sales_id = $1
             LIMIT 1`,
            [sales_id],
        )

        return (rowCount ?? 0) > 0
    }

    async getCustomerBySaleId(sales_id: number): Promise<DebtSaleCustomer | null> {
        const { rows } = await pool.query(
            `SELECT customers.id, customers.name, customers.last_name
             FROM debts
             INNER JOIN customers ON customers.id = debts.customer_id
             WHERE debts.sales_id = $1
             LIMIT 1`,
            [sales_id],
        )

        return rows.length ? rows[0] as DebtSaleCustomer : null
    }

    async getBySaleIdForUpdate(sales_id: number, client: PoolClient): Promise<DebtForSaleDeletion | null> {
        const { rows } = await client.query(
            `SELECT id
             FROM debts
             WHERE sales_id = $1
             LIMIT 1
             FOR UPDATE`,
            [sales_id],
        )

        if (!rows.length) {
            return null
        }

        return rows[0] as DebtForSaleDeletion
    }

    async create( data : DebtDTO, client?: PoolClient ): Promise< Debt > {
        const executor = client ?? pool
        const { rows } = await executor.query(
            `INSERT INTO debts (sales_id, customer_id, amount) VALUES ($1, $2, $3) RETURNING *`, 
            [data.sales_id, data.customer_id, data.amount]

        )
        return mapToModel( Debt, rows[0] )
    }

    async getByIdForUpdate(id: number, client: PoolClient): Promise<DebtForPayment | null> {
        const { rows } = await client.query(
            `SELECT id, amount, status FROM debts WHERE id = $1 FOR UPDATE`,
            [id]
        )

        if (!rows.length) {
            return null
        }

        return rows[0] as DebtForPayment
    }

    async updatePaymentState(id: number, data: DebtPaymentUpdateData, client: PoolClient): Promise<Debt | null> {
        const { rows } = await client.query(
            `UPDATE debts
             SET amount = $1, status = $2, pay_method = $3, updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [data.amount, data.status, data.pay_method, id]
        )

        if (!rows.length) {
            return null
        }

        return mapToModel(Debt, rows[0])
    }

    async createPaymentEvent(debt_id: number, close_id: number, data: RecordDebtPayment, client: PoolClient): Promise<DebtPaymentEvent> {
        const { rows } = await client.query(
            `INSERT INTO debt_payment_events (debt_id, close_id, paid_amount, pay_method)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [debt_id, close_id, data.paid_amount, data.pay_method]
        )

        return mapToModel(DebtPaymentEvent, rows[0])
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

    async delete(id: number, client?: PoolClient): Promise<boolean> {
        const executor = client ?? pool
        const { rowCount } = await executor.query(
            `DELETE FROM debts WHERE id = $1`,
            [id],
        )

        return (rowCount ?? 0) > 0
    }
    
}

export const debtRepository = new DebtRepository()
