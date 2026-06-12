import type { CreateSaleDetailData } from '@carniceria/shared'
import type { Sale } from './models/sale.model'
import type { SaleDetail } from '../sale-details/models/sale-detail.model'
import type { SaleFilters } from './types'

export interface SaleDetailInput extends CreateSaleDetailData {}

export interface SaleRemitoCustomer {
    id: number
    name: string
    last_name: string
}

export interface SaleRemitoData {
    sale: Sale
    details: SaleDetail[]
    customer: SaleRemitoCustomer | null
}

export interface ISaleService {
    create(data: unknown, details?: SaleDetailInput[], customer_id?: number): Promise<Sale>
    update(id: number, data: unknown, details?: SaleDetailInput[], customer_id?: number): Promise<Sale>
    delete(id: number): Promise<void>
    search(filters?: SaleFilters): Promise<Sale[]>
    getById(id: number): Promise<Sale>
    getDetails(id: number): Promise<SaleDetail[]>
    getRemitoData(id: number): Promise<SaleRemitoData>
}
