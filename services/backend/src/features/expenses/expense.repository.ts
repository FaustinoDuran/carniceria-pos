import { pool } from '../../db'
import { Expense } from './models/expense.model'
import { ExpenseDTO } from './models/expense.dto'
import { mapToModel } from "../../shared/mappers.helper";
import { PoolClient } from 'pg';

export interface ExpenseFilters {
    close_id?: number | null
    id?: number
    category?: string
    created_at?: Date 

}

export class ExpenseRepository {

    async getAll(filters? : ExpenseFilters, client?: PoolClient) : Promise<Expense[]> {

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

        if (filters?.category !== undefined) {
            values.push(filters.category)
            conditions.push(`category = $${values.length}`)
        }

        if(filters?.created_at) {
            values.push(filters.created_at)
            conditions.push(`DATE(created_at) = DATE($${values.length})`)
        }

        const where =  conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

        const executor = client ?? pool
        const { rows } = await executor.query(
            `SELECT ALL * FROM expenses ${where} ORDER BY created_at DESC`,
            values
        )

        return rows.map(row => mapToModel(Expense, row))
    }

    async getById(id: number, client?: PoolClient): Promise<Expense | null> {
        const executor = client ?? pool
        const { rows } = await executor.query(
            'SELECT * FROM expenses WHERE id = $1',
            [id]
        )
        return rows.length ? mapToModel(Expense, rows[0]) : null
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

    async update(id: number, data: { category?: string; amount?: number; description?: string }, client?: PoolClient): Promise<Expense | null> {
        const conditions: string[] = []
        const values: unknown[] = []

        if (data.category !== undefined) {
            values.push(data.category)
            conditions.push(`category = $${values.length}`)
        }

        if (data.amount !== undefined) {
            values.push(data.amount)
            conditions.push(`amount = $${values.length}`)
        }

        if (data.description !== undefined) {
            values.push(data.description)
            conditions.push(`description = $${values.length}`)
        }

        if (conditions.length === 0) {
            return null
        }

        values.push(id)
        const setClause = conditions.join(', ')
        const executor = client ?? pool
        const { rows } = await executor.query(
            `UPDATE expenses SET ${setClause} WHERE id = $${values.length} AND close_id IS NULL RETURNING *`,
            values
        )

        return rows.length ? mapToModel(Expense, rows[0]) : null
    }

    async setClosed( close_id : number, expense_ids : number[], client?: PoolClient ) : Promise< boolean > {
        const executor = client ?? pool
        const { rowCount } = await executor.query(
            'UPDATE expenses SET close_id = $1 WHERE id = ANY($2) AND close_id IS NULL',[close_id,expense_ids]
        )
        return (rowCount ?? 0) > 0
    }
            
}

export const expenseRepository = new ExpenseRepository()
