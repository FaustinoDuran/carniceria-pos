export const queryKeys = {
  customers: (filters?: unknown) => ['customers', filters] as const,
  deletedCustomers: (filters?: unknown) => ['customers', 'deleted', filters] as const,
  sales: (filters?: unknown) => ['sales', filters] as const,
  saleDetails: (saleId: number) => ['sales', saleId, 'details'] as const,
  expenses: (filters?: unknown) => ['expenses', filters] as const,
  debts: (filters?: unknown) => ['debts', filters] as const,
  debtPayments: (debtId: number) => ['debts', debtId, 'payments'] as const,
  closes: (filters?: unknown) => ['closes', filters] as const,
  activeClose: ['closes', 'active'] as const,
  closeReport: (closeId: number) => ['closes', closeId, 'report'] as const,
}
