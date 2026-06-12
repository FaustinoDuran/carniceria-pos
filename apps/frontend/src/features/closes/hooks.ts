import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { downloadClosePdf, finishClose, getActiveClose, getCloseReport, getCloses, startClose } from './api'
import { getErrorMessage } from '@/lib/errors'
import { queryKeys } from '@/lib/query-keys'

export function useActiveClose() {
  return useQuery({ queryKey: queryKeys.activeClose, queryFn: getActiveClose })
}

export function useCloses() {
  return useQuery({ queryKey: queryKeys.closes(), queryFn: getCloses })
}

export function useCloseReport(id: number) {
  return useQuery({ queryKey: queryKeys.closeReport(id), queryFn: () => getCloseReport(id), enabled: Number.isFinite(id) })
}

export function useStartClose() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: startClose,
    onSuccess: () => {
      toast.success('Caja abierta')
      queryClient.invalidateQueries({ queryKey: ['closes'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useFinishClose() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, expected_cash }: { id: number; expected_cash?: number | null }) => finishClose(id, expected_cash),
    onSuccess: () => {
      toast.success('Caja cerrada')
      queryClient.invalidateQueries({ queryKey: ['closes'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useDownloadClosePdf() {
  return useMutation({
    mutationFn: downloadClosePdf,
    onSuccess: (blob, id) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cierre-${id}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}
