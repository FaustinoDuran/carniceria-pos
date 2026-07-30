import { pool } from '../../db'
import { mapToModel } from '../../shared/mappers.helper'
import { OpenClose } from './models/openClose.model'
import { FinishClose } from './models/finishClose.model'
import { Close } from './models/close.model'
import { PoolClient } from 'pg'

interface CloseFilters {
    start_at?: Date,
    end_at?: Date | null
    month?: string
    limit?: number
    offset?: number
}

export class CloseRepository {
    
    async create( data : OpenClose, client?: PoolClient) : Promise<Close> {
        const executor = client ?? pool
        const { rows } = await executor.query(
            'INSERT INTO closes (start_at) VALUES ($1) RETURNING *',
            [data.start_at]
        )
        return mapToModel( Close, rows[0] )
    }
    
    async getAll( filters?: CloseFilters, client?: PoolClient ) : Promise< Close[] > {
        const conditions: string[] = []
        const values: unknown[] = []

        
        if (filters?.start_at) {
            values.push(filters.start_at)
            conditions.push(`DATE(start_at) = DATE($${values.length})`)
        }
        if (filters?.month) {
            values.push(filters.month)
            conditions.push(`TO_CHAR(start_at, 'YYYY-MM') = $${values.length}`)
        }
        if (filters?.end_at === null) {
            conditions.push('end_at IS NULL')
        } else if (filters?.end_at !== undefined) {
            values.push(filters.end_at)
            conditions.push(`DATE(end_at) = DATE($${values.length})`)
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

        let pagination = ''
        if (filters?.limit !== undefined) {
            values.push(filters.limit)
            pagination += ` LIMIT $${values.length}`
        }
        if (filters?.offset !== undefined) {
            values.push(filters.offset)
            pagination += ` OFFSET $${values.length}`
        }

        const executor = client ?? pool
        const { rows } = await executor.query(
            `SELECT * FROM closes ${where} ORDER BY DATE(start_at) DESC, id DESC${pagination}`, values
        )
        return rows.map( row => mapToModel( Close, row))
    }

    async getById(id: number, client?: PoolClient): Promise< Close | null > {
        const executor = client ?? pool
        const { rows } = await executor.query(
            'SELECT * FROM closes WHERE id = $1',
            [id]
        )
        if (rows.length === 0) return null
        return mapToModel(Close, rows[0])
    }
    
    async getActive(client?: PoolClient): Promise<Close | null> {
        const executor = client ?? pool
        const { rows } = await executor.query(
            'SELECT * FROM closes WHERE end_at IS NULL'
        )
        if (rows.length === 0) return null
        return mapToModel(Close, rows[0])
    }

    async finish(id: number, dto: FinishClose, client?: PoolClient): Promise<Close | null> {
        const executor = client ?? pool
        const { rows } = await executor.query(
            `UPDATE closes SET end_at = $1, total_income = $2, total_expense = $3, expected_cash = $4, expected_card = $5 WHERE id = $6 AND end_at IS NULL
            RETURNING *`,  [dto.end_at, dto.total_income, dto.total_expense, dto.expected_cash, dto.expected_card, id]    )
    
        return rows.length ? mapToModel(Close, rows[0]) : null
    }
}

export const closeRepository = new CloseRepository()

