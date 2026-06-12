import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createExpense, deleteExpense, ExpenseFilters, getExpenses, updateExpense } from './api'
import { getErrorMessage } from '@/lib/errors'
import { queryKeys } from '@/lib/query-keys'

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({ queryKey: queryKeys.expenses(filters), queryFn: () => getExpenses(filters) })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      toast.success('Gasto registrado')
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['closes'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Parameters<typeof updateExpense>[1] }) => updateExpense(id, input),
    onSuccess: () => {
      toast.success('Gasto actualizado')
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      toast.success('Gasto eliminado')
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}
