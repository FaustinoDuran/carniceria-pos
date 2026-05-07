import { pool } from '../../db'
import { SaleDetailDTO } from './models/sale-detail.dto'
import { SaleDetail } from './models/sale-detail.model'
import { mapToModel } from '../../shared/mappers.helper'

export class SaleDetailRepository {


    async createMany(sale_id: number, details: SaleDetailDTO[]): Promise<SaleDetail[]> {
        if (!details.length) {
            return []
        }

        const values: unknown[] = []

        const valueRows = details.map((detail, index) => {
            const offset = index * 5
            values.push(sale_id, detail.cut_name, detail.price_per_kg, detail.weight_kg, detail.subtotal)
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`
        })

        const { rows } = await pool.query(
            `INSERT INTO sale_details (sale_id, cut_name, price_per_kg, weight_kg, subtotal)
             VALUES ${valueRows.join(', ')}
             RETURNING id, sale_id, cut_name, price_per_kg, weight_kg, subtotal, created_at`,
            values
        )

        return rows.map((row) => mapToModel(SaleDetail, row))
    }

    async getBySaleId(sale_id: number): Promise<SaleDetail[]> {
        const { rows } = await pool.query(
            `SELECT id, sale_id, cut_name, price_per_kg, weight_kg, subtotal, created_at
             FROM sale_details
             WHERE sale_id = $1
             ORDER BY created_at DESC, id DESC`,
            [sale_id]
        )

        return rows.map((row) => mapToModel(SaleDetail, row))
    }

}

export const saleDetailRepository = new SaleDetailRepository()
