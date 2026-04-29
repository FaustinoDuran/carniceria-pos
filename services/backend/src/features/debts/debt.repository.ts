import { pool } from '../../db'
import { mapToModel } from '../../shared/mappers.helper'
import { DebtData } from '@carniceria/shared'
import { Debt } from './models/debt.model'
import { DebtDTO } from './models/debt.dto'
import { UpdateDebt } from './models/updateDebt.model'
 
interface DebtFilters {
    customer_id?:number,
    status?: DebtData['status'],
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

    async update( id : number, data : UpdateDebt ) : Promise< Debt | null > {
        const { rows } = await pool.query(
            `UPDATE debts SET amount = $1, status = $2 WHERE id = $3 AND status != 'paid' RETURNING *`,
            [data.amount,data.status,id]
        )

        return rows.length? mapToModel(Debt, rows[0]) : null
    }
    
}

export const debtRepository = new DebtRepository()
