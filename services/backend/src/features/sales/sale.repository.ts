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


    async create( data:SaleDTO ) : Promise< Sale > {
        const { rows } = await pool.query(
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

    async setClosed( close_id : number, sale_ids : number[], client?: PoolClient ) : Promise< boolean > {
        const executor = client ?? pool
        const { rowCount } = await executor.query(
            'UPDATE sales SET close_id = $1 WHERE id = ANY($2) AND close_id IS NULL',[close_id,sale_ids]
        )
        return (rowCount ?? 0) > 0
    }
}

export const saleRepository = new SaleRepository()
