import { pool } from '../../db'
import { Sale } from './models/sale.model';
import { SaleDTO } from './models/sale.dto';
import { SaleFilters } from './types';
import { mapToModel } from "../../shared/mappers.helper";
import { PoolClient } from 'pg';

export class SaleRepository {

    async getAll(filters?: SaleFilters, client?: PoolClient): Promise<Sale[]> {
        
        
        const conditions: string[] = []
        const values: unknown[] = []

        if(filters?.date) {
            values.push(filters.date)
            conditions.push(`DATE(created_at) = DATE($${values.length})`)
        }

        if(filters?.close_id !== undefined) {
            if(filters.close_id === null) {
                conditions.push(`close_id IS NULL`)
            } else {
                values.push(filters.close_id)
                conditions.push(`close_id = $${values.length}`)
            }
        }

        if(filters?.pay_method) {
            values.push(filters.pay_method)
            conditions.push(`pay_method = $${values.length}`)
        }
        
        if (filters?.id !== undefined) {
            values.push(filters.id)
            conditions.push(`id = $${values.length}`)
        }
        
        const where = conditions.length
            ? `WHERE ${conditions.join(' AND ')}`
            : ''

        const executor = client ?? pool 
        const { rows } = await executor.query(
            `SELECT * FROM sales ${where} ORDER BY created_at DESC`,
            values
        )

        return rows.map(row => mapToModel(Sale, row))
        
    }

    async getById(id: number, client?: PoolClient): Promise<Sale | null> {
        const sales = await this.getAll({ id }, client)
        return sales.length ? sales[0] : null
    }


    async create( data:SaleDTO, client?: PoolClient ) : Promise< Sale > {
        const executor = client ?? pool
        const { rows } = await executor.query(
            'INSERT INTO sales (amount_meat, amount_merchandise, pay_method) VALUES ($1, $2, $3) RETURNING *',
            [data.amount_meat, data.amount_merchandise, data.pay_method]
        )
        return mapToModel( Sale,rows[0] )
    }

    async delete( id : number ) : Promise< boolean > {
        const { rowCount } = await pool.query(
            'DELETE FROM sales WHERE id = $1 AND close_id IS NULL',[id]
        )
        return (rowCount ?? 0) > 0
    }

    async update(id: number, data: { amount_meat?: number; amount_merchandise?: number; pay_method?: string }, client?: PoolClient): Promise<Sale | null> {
        const conditions: string[] = []
        const values: unknown[] = []

        if (data.amount_meat !== undefined) {
            values.push(data.amount_meat)
            conditions.push(`amount_meat = $${values.length}`)
        }

        if (data.amount_merchandise !== undefined) {
            values.push(data.amount_merchandise)
            conditions.push(`amount_merchandise = $${values.length}`)
        }

        if (data.pay_method !== undefined) {
            values.push(data.pay_method)
            conditions.push(`pay_method = $${values.length}`)
        }

        if (conditions.length === 0) {
            return null
        }

        values.push(id)
        const setClause = conditions.join(', ')
        const executor = client ?? pool
        const { rows } = await executor.query(
            `UPDATE sales SET ${setClause} WHERE id = $${values.length} AND close_id IS NULL RETURNING *`,
            values
        )

        return rows.length ? mapToModel(Sale, rows[0]) : null
    }

    async setClosed( close_id : number, sale_ids : number[], client?: PoolClient ) : Promise< boolean > {
        const executor = client ?? pool
        const { rowCount } = await executor.query(
            'UPDATE sales SET close_id = $1 WHERE id = ANY($2) AND close_id IS NULL',[close_id,sale_ids]
        )
        return (rowCount ?? 0) > 0
    }
}

export const saleRepository = new SaleRepository()
