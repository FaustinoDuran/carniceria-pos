import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createCustomer, deleteCustomer, getCustomers, getDeletedCustomers, restoreCustomer, updateCustomer, CustomerFilters } from './api'
import { getErrorMessage } from '@/lib/errors'
import { queryKeys } from '@/lib/query-keys'

export function useCustomers(filters?: CustomerFilters) {
  return useQuery({ queryKey: queryKeys.customers(filters), queryFn: () => getCustomers(filters) })
}

export function useDeletedCustomers(filters?: CustomerFilters) {
  return useQuery({ queryKey: queryKeys.deletedCustomers(filters), queryFn: () => getDeletedCustomers(filters) })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      toast.success('Cliente creado')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: Parameters<typeof updateCustomer> extends [infer I, infer D] ? { id: I; input: D } : never) => updateCustomer(id as number, input),
    onSuccess: () => {
      toast.success('Cliente actualizado')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      toast.success('Cliente eliminado')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useRestoreCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: restoreCustomer,
    onSuccess: () => {
      toast.success('Cliente restaurado')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}
