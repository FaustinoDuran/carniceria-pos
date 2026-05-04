import { pool } from '../../db'
import { Expense } from './models/expense.model'
import { ExpenseDTO } from './models/expense.dto'
import { mapToModel } from "../../shared/mappers.helper";

export interface ExpenseFilters {
    close_id?: number | null
    id?: number
    created_at?: Date 

}

export class ExpenseRepository {

    async getAll(filters? : ExpenseFilters) : Promise<Expense[]> {

        const conditions: string[] = []
        const values: unknown[] = []

        
        if(filters?.close_id !== undefined) {
            if(filters.close_id === null) {
                conditions.push(`close_id IS NULL`)
            } else {
                values.push(filters.close_id)
                conditions.push(`close_id = $${values.length}`)
            }
        }

        if (filters?.id !== undefined) {
            values.push(filters.id)
            conditions.push(`id = $${values.length}`)
        }

        if(filters?.created_at) {
            values.push(filters.created_at)
            conditions.push(`DATE(created_at) = DATE($${values.length})`)
        }

        const where =  conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

        const { rows } = await pool.query(
            `SELECT ALL * FROM expenses ${where} ORDER BY created_at DESC`,
            values
        )

        return rows.map(row => mapToModel(Expense, row))
    }

    async create( data : ExpenseDTO ) : Promise< Expense > {
        const { rows } = await pool.query(
            `INSERT INTO expenses (category, amount, description) VALUES ($1, $2, $3) RETURNING *`,
            [data.category, data.amount, data.description]
        )
        return mapToModel( Expense, rows[0] )   
    }

    async delete(id : number) : Promise< boolean > {
        const { rowCount } = await pool.query(
            `DELETE FROM expenses WHERE id = $1 AND close_id IS NULL`, [id]
        )
        return (rowCount ?? 0) >  0
    }

    async setClosed( close_id : number, expense_ids : number[] ) : Promise< boolean > {
        const { rowCount } = await pool.query(
            'UPDATE expenses SET close_id = $1 WHERE id = ANY($2) AND close_id IS NULL',[close_id,expense_ids]
        )
        return (rowCount ?? 0) > 0
    }
            
}

export const expenseRepository = new ExpenseRepository()