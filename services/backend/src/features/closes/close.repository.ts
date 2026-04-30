import { pool } from '../../db'
import { mapToModel } from '../../shared/mappers.helper'
import { OpenClose } from './models/openClose.model'
import { FinishClose } from './models/finishClose.model'
import { Close } from './models/close.model'

interface CloseFilters {
    id?: number,
    start_at?: string,
    end_at?: string
}

export class CloseRepository {
    
    async create( data : OpenClose) : Promise<Close> {
        const { rows } = await pool.query(
            'INSERT INTO closes (start_at) VALUES ($1) RETURNING *',
            [data.start_at]
        )
        return mapToModel( Close, rows[0] )
    }
    
    async getAll( filters?: CloseFilters ) : Promise< Close[] | null> {
        const conditions: string[] = []
        const values: unknown[] = []

        if (filters?.id !== undefined) {
            values.push(filters.id)
            conditions.push(`id = $${values.length}`)
        }
        
        if (filters?.start_at) {
            values.push(filters.start_at)
            conditions.push(`DATE(start_at) = DATE($${values.length})`)
        }
        if(filters?.end_at) {
            values.push(filters.end_at)
            conditions.push(`DATE(end_at) = DATE($${values.length})`)
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

        const { rows } = await pool.query(
            `SELECT * FROM closes ${where} ORDER BY created_at DESC`, values
        )
        return rows.map( row => mapToModel( Close, row))
    }

    async finish(id: number, dto: FinishClose): Promise<Close | null> {
        const { rows } = await pool.query(
            `UPDATE closes SET end_at = $1, total_income = $2, total_expense = $3 WHERE id = $4 AND end_at IS NULL
            RETURNING *`,  [dto.end_at, dto.total_income, dto.total_expense, id]    )
    
        return rows.length ? mapToModel(Close, rows[0]) : null
    }
}

export const closeRepository = new CloseRepository()


