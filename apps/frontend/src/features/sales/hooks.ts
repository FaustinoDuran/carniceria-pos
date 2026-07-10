import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createSale, deleteSale, getSaleDetails, getSales, SaleFilters, updateSale } from './api'
import { getErrorMessage } from '@/lib/errors'
import { queryKeys } from '@/lib/query-keys'

export const SALES_PAGE_SIZE = 50

export function useSales(filters?: SaleFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.sales(filters),
    queryFn: ({ pageParam }) => getSales({ ...filters, limit: SALES_PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === SALES_PAGE_SIZE ? allPages.length * SALES_PAGE_SIZE : undefined,
  })
}

export function useSaleDetails(saleId: number, enabled = true) {
  return useQuery({ queryKey: queryKeys.saleDetails(saleId), queryFn: () => getSaleDetails(saleId), enabled })
}

export function useCreateSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      toast.success('Venta registrada')
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      queryClient.invalidateQueries({ queryKey: ['closes'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useUpdateSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Parameters<typeof updateSale>[1] }) => updateSale(id, input),
    onSuccess: (_sale, variables) => {
      toast.success('Venta actualizada')
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.saleDetails(variables.id) })
      queryClient.invalidateQueries({ queryKey: ['debts'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useDeleteSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteSale,
    onSuccess: () => {
      toast.success('Venta eliminada')
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}
