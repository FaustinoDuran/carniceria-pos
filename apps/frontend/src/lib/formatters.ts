export const moneyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export const timeFormatter = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
})

export function formatMoney(value: number | null | undefined): string {
  return moneyFormatter.format(value ?? 0)
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-'
  return dateFormatter.format(new Date(value))
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '-'
  return timeFormatter.format(new Date(value))
}

export function saleTotal(sale: { amount_meat: number; amount_merchandise: number }): number {
  return sale.amount_meat + sale.amount_merchandise
}

export function payMethodLabel(payMethod: string): string {
  const labels: Record<string, string> = {
    cash: 'Efectivo',
    credit: 'Crédito',
    debit: 'Débito',
    transfer: 'Transferencia',
    cc: 'Cuenta corriente',
  }

  return labels[payMethod] || payMethod
}
