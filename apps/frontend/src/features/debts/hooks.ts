import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DebtFilters, getDebtPayments, getDebts, recordDebtPayment } from './api'
import { getErrorMessage } from '@/lib/errors'
import { queryKeys } from '@/lib/query-keys'

export function useDebts(filters?: DebtFilters) {
  return useQuery({ queryKey: queryKeys.debts(filters), queryFn: () => getDebts(filters) })
}

export function useDebtPayments(debtId: number, enabled = true) {
  return useQuery({ queryKey: queryKeys.debtPayments(debtId), queryFn: () => getDebtPayments(debtId), enabled })
}

export function useRecordDebtPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ debtId, input }: { debtId: number; input: Parameters<typeof recordDebtPayment>[1] }) => recordDebtPayment(debtId, input),
    onSuccess: () => {
      toast.success('Pago registrado')
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      queryClient.invalidateQueries({ queryKey: ['closes'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}
