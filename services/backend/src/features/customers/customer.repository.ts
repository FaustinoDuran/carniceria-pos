import { pool } from '../../db'
import { Customer } from './models/customer.model'
import { CustomerDTO } from './models/customer.dto'
import { CustomerFilters } from './types'
import { mapToModel } from '../../shared/mappers.helper'


export class CustomerRepository {
    
    async getAll(filters?: CustomerFilters): Promise<Customer[]> {

        const conditions: string[] = ['deleted_at IS NULL']
        const values: unknown[] = []

   
        if (filters?.name) {
            values.push(`%${filters.name}%`)
            conditions.push(`name ILIKE $${values.length}`)
        }

        const where = `WHERE ${conditions.join(' AND ')}`

        const { rows } = await pool.query(
            `SELECT * FROM customers ${where} ORDER BY created_at DESC`, values
        )

         return rows.map(row => mapToModel(Customer, row))
    }

    async getById( id : number ) : Promise <Customer | null > {
        const { rows } = await pool.query(
            'SELECT * FROM customers WHERE id = $1 AND deleted_at IS NULL',
            [id]
        )
        return rows.length > 0 ? mapToModel(Customer, rows[0]) : null
    }

    async create( data : CustomerDTO ) : Promise < Customer> {
        const { rows } = await pool.query(
            'INSERT INTO customers (name, last_name, phone, dni) VALUES ($1, $2, $3, $4) RETURNING *',
            [data.name, data.last_name, data.phone, data.dni]
        )
        return mapToModel(Customer, rows[0])
    }

    async softDelete( id : number ) : Promise < boolean > {
        const { rowCount } = await pool.query(
            'UPDATE customers SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
            [id]
        )
        return (rowCount ?? 0) > 0
    }


    async restore(id: number): Promise<boolean> {
        const { rowCount } = await pool.query(
            'UPDATE customers SET deleted_at = NULL WHERE id = $1',
            [id]
        )
        return (rowCount ?? 0) > 0
    }

    
}