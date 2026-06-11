import type { CreateSaleDetailData } from '@carniceria/shared'
import type { Sale } from './models/sale.model'
import type { SaleDTO, UpdateSaleDTO } from './models/sale.dto'
import type { SaleFilters } from './types'

export interface SaleDetailInput extends CreateSaleDetailData {}

export interface ISaleService {
    create(data: SaleDTO, details?: SaleDetailInput[], customer_id?: number): Promise<Sale>
    update(id: number, data: UpdateSaleDTO, details?: SaleDetailInput[], customer_id?: number): Promise<Sale>
    delete(id: number): Promise<void>
    search(filters?: SaleFilters): Promise<Sale[]>
    getById(id: number): Promise<Sale>
}
