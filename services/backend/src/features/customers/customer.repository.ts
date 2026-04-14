import { pool } from '../../db'
import { Customer } from './models/customer.model'
import { CustomerDTO } from './models/customer.dto'


export class CustomerRepository {
    
    private mapToModel( row: unknown ) : Customer {
        return new Customer(row)
    }
    
    async getAll() : Promise < Customer[] > {
        const { rows } = await pool.query(
            'SELECT * FROM customers WHERE deleted_at IS NULL ORDER BY created_at DESC'
        )
        return rows.map(row => this.mapToModel(row))
    }

    async getById( id : number ) : Promise <Customer | null > {
        const { rows } = await pool.query(
            'SELECT * FROM customers WHERE id = $1 AND deleted_at IS NULL',
            [id]
        )
        return rows.length > 0 ? this.mapToModel(rows[0]) : null
    }

    async create( data : CustomerDTO ) : Promise < Customer> {
        const { rows } = await pool.query(
            'INSERT INTO customers (name, last_name, phone, dni) VALUES ($1, $2, $3, $4) RETURNING *',
            [data.name, data.last_name, data.phone, data.dni]
        )
        return this.mapToModel(rows[0])
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