import { CreateCustomerData, CustomerData, UpdateCustomerData } from '@carniceria/shared'
import { apiClient } from '@/lib/api-client'

export interface Customer extends Omit<CustomerData, 'created_at' | 'deleted_at'> {
  created_at: string
  deleted_at: string | null
}

export interface CustomerFilters {
  name?: string
  dni?: string
}

export async function getCustomers(filters?: CustomerFilters): Promise<Customer[]> {
  const { data } = await apiClient.get<Customer[]>('/customers', { params: filters })
  return data
}

export async function getDeletedCustomers(filters?: CustomerFilters): Promise<Customer[]> {
  const { data } = await apiClient.get<Customer[]>('/customers/deleted', { params: filters })
  return data
}

export async function createCustomer(input: CreateCustomerData): Promise<Customer> {
  const { data } = await apiClient.post<Customer>('/customers', input)
  return data
}

export async function updateCustomer(id: number, input: UpdateCustomerData): Promise<Customer> {
  const { data } = await apiClient.put<Customer>(`/customers/${id}`, input)
  return data
}

export async function deleteCustomer(id: number): Promise<void> {
  await apiClient.delete(`/customers/${id}`)
}

export async function restoreCustomer(id: number): Promise<Customer> {
  const { data } = await apiClient.patch<Customer>(`/customers/${id}/restore`)
  return data
}
