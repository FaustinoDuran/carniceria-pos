import { pool } from '../../db'
import { Customer } from './models/customer.model'
import { CustomerDTO, UpdateCustomerDTO } from './models/customer.dto'
import { mapToModel } from '../../shared/mappers.helper'

interface CustomerFilters {
  name?: string
  dni?: string
  deleted?: boolean
}

export class CustomerRepository {
    
    async getAll(filters?: CustomerFilters): Promise<Customer[]> {

        const conditions: string[] = [filters?.deleted ? 'deleted_at IS NOT NULL' : 'deleted_at IS NULL']
        const values: unknown[] = []

   
        if (filters?.name) {
            values.push(`%${filters.name}%`)
            conditions.push(`(name ILIKE $${values.length} OR last_name ILIKE $${values.length})`)
        }

        if (filters?.dni) {
            values.push(`%${filters.dni}%`)
            conditions.push(`dni ILIKE $${values.length}`)
        }

        const where = `WHERE ${conditions.join(' AND ')}`

        const { rows } = await pool.query(
            `SELECT * FROM customers ${where} ORDER BY created_at ASC`, values
        )

         return rows.map(row => mapToModel(Customer, row))
    }

    async getById(id: number): Promise<Customer | null> {
        const { rows } = await pool.query(
            'SELECT * FROM customers WHERE id = $1 AND deleted_at IS NULL',
            [id]
        )
        if (rows.length === 0) return null
        return mapToModel(Customer, rows[0])
    }

    async getByIdIncludingDeleted(id: number): Promise<Customer | null> {
        const { rows } = await pool.query(
            'SELECT * FROM customers WHERE id = $1',
            [id]
        )
        if (rows.length === 0) return null
        return mapToModel(Customer, rows[0])
    }


    async getByDni(dni: string): Promise<Customer | null> {
        const { rows } = await pool.query(
            'SELECT * FROM customers WHERE dni = $1 AND deleted_at IS NULL',
            [dni]
        )
        if (rows.length === 0) return null
        return mapToModel(Customer, rows[0])
    }


    async create( data : CustomerDTO ) : Promise < Customer> {
        const { rows } = await pool.query(
            'INSERT INTO customers (name, last_name, phone, dni) VALUES ($1, $2, $3, $4) RETURNING *',
            [data.name, data.last_name, data.phone, data.dni]
        )
        return mapToModel(Customer, rows[0])
    }

    async update(id: number, data: UpdateCustomerDTO): Promise<Customer | null> {
        const fields: string[] = []
        const values: unknown[] = []

        if (data.name !== undefined) {
            values.push(data.name)
            fields.push(`name = $${values.length}`)
        }

        if (data.last_name !== undefined) {
            values.push(data.last_name)
            fields.push(`last_name = $${values.length}`)
        }

        if (data.phone !== undefined) {
            values.push(data.phone)
            fields.push(`phone = $${values.length}`)
        }

        if (data.dni !== undefined) {
            values.push(data.dni)
            fields.push(`dni = $${values.length}`)
        }

        if (fields.length === 0) {
            return this.getById(id)
        }

        values.push(id)
        const { rows } = await pool.query(
            `UPDATE customers SET ${fields.join(', ')} WHERE id = $${values.length} AND deleted_at IS NULL RETURNING *`,
            values,
        )

        return rows.length ? mapToModel(Customer, rows[0]) : null
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
            'UPDATE customers SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL',
            [id]
        )
        return (rowCount ?? 0) > 0
    }

    
}

export const customerRepository = new CustomerRepository();
