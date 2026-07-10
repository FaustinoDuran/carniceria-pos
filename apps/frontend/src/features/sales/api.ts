import { CreateSaleDetailData, SalesData, UpdateSalesData } from '@carniceria/shared'
import { apiClient } from '@/lib/api-client'

export interface Sale extends Omit<SalesData, 'created_at'> {
  created_at: string
}

export interface SaleDetail {
  id: number
  sale_id: number
  cut_name: string
  price_per_kg: number
  weight_kg: number
  subtotal: number
  created_at: string
}

export interface SaleFilters {
  date?: string
  close_id?: number | 'null'
  pay_method?: string
  limit?: number
  offset?: number
}

export interface CreateSaleInput {
  amount_meat: number
  amount_merchandise: number
  pay_method: Sale['pay_method']
  customer_id?: number
  details?: CreateSaleDetailData[]
}

export interface UpdateSaleInput extends UpdateSalesData {
  customer_id?: number
  details?: CreateSaleDetailData[]
}

export async function getSales(filters?: SaleFilters): Promise<Sale[]> {
  const { data } = await apiClient.get<Sale[]>('/sales', { params: filters })
  return data
}

export async function getSaleDetails(id: number): Promise<SaleDetail[]> {
  const { data } = await apiClient.get<SaleDetail[]>(`/sales/${id}/details`)
  return data
}

export async function getSaleRemitoPdf(id: number): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/sales/${id}/remito/pdf`, { responseType: 'blob' })
  return data
}

export async function createSale(input: CreateSaleInput): Promise<Sale> {
  const { data } = await apiClient.post<Sale>('/sales', input)
  return data
}

export async function updateSale(id: number, input: UpdateSaleInput): Promise<Sale> {
  const { data } = await apiClient.put<Sale>(`/sales/${id}`, input)
  return data
}

export async function deleteSale(id: number): Promise<void> {
  await apiClient.delete(`/sales/${id}`)
}
