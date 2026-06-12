import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/common/page-header'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { Money } from '@/components/common/money'
import { DecimalInput } from '@/components/common/decimal-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, payMethodLabel } from '@/lib/formatters'
import { Customer } from '@/features/customers/api'
import { useCustomers } from '@/features/customers/hooks'
import { Debt } from '../api'
import { useDebtPayments, useDebts, useRecordDebtPayment } from '../hooks'

function PaymentHistory({ debtId }: { debtId: number }) {
  const payments = useDebtPayments(debtId)
  if (payments.isLoading) return <p className="text-sm text-slate-500">Cargando pagos...</p>
  if (!payments.data?.length) return <p className="text-sm text-slate-500">Sin pagos registrados para esta deuda.</p>
  return (
    <div className="space-y-2">
      {payments.data.map((payment) => (
        <div key={payment.id} className="flex items-center justify-between rounded-md border border-slate-200 p-2 text-sm">
          <span>{formatDate(payment.created_at)} · {payMethodLabel(payment.pay_method)}</span>
          <Money value={payment.paid_amount} />
        </div>
      ))}
    </div>
  )
}

function AccountDialog({ customer, open, onOpenChange }: { customer: Customer | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const debts = useDebts(customer ? { customer_id: customer.id } : undefined)
  const recordPayment = useRecordDebtPayment()
  const [activePayment, setActivePayment] = useState<number | null>(null)
  const [paidAmount, setPaidAmount] = useState(0)
  const [payMethod, setPayMethod] = useState<'cash' | 'credit' | 'debit' | 'transfer'>('cash')

  function submitPayment(debt: Debt) {
    recordPayment.mutate({
      debtId: debt.id,
      input: { paid_amount: paidAmount, pay_method: payMethod },
    }, {
      onSuccess: () => {
        setActivePayment(null)
        setPaidAmount(0)
      },
    })
  }

  const pendingDebts = debts.data?.filter((debt) => debt.status !== 'paid') || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,980px)]">
        <DialogHeader><DialogTitle>Cuenta corriente · {customer?.name} {customer?.last_name}</DialogTitle></DialogHeader>
        <Tabs defaultValue="debts">
          <TabsList><TabsTrigger value="debts">Resumen de deudas</TabsTrigger><TabsTrigger value="payments">Historial de pagos</TabsTrigger></TabsList>
          <TabsContent value="debts">
            {debts.isLoading ? <LoadingState /> : !pendingDebts.length ? <EmptyState title="Cliente al día" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Venta</TableHead><TableHead>Saldo</TableHead><TableHead>Estado</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {pendingDebts.map((debt) => (
                    <TableRow key={debt.id}>
                      <TableCell>{formatDate(debt.created_at)}</TableCell>
                      <TableCell>#{debt.sales_id}</TableCell>
                      <TableCell><Money value={debt.amount} /></TableCell>
                      <TableCell><Badge variant={debt.status === 'partial' ? 'warning' : 'danger'}>{debt.status}</Badge></TableCell>
                      <TableCell>
                        {activePayment === debt.id ? (
                          <div className="flex flex-wrap items-end gap-2">
                            <div className="space-y-1"><Label>Monto</Label><DecimalInput className="w-32" max={debt.amount} value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} /></div>
                            <Select value={payMethod} onValueChange={(value) => setPayMethod(value as typeof payMethod)}>
                              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">Efectivo</SelectItem>
                                <SelectItem value="credit">Crédito</SelectItem>
                                <SelectItem value="debit">Débito</SelectItem>
                                <SelectItem value="transfer">Transferencia</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" onClick={() => submitPayment(debt)} disabled={recordPayment.isPending}>Confirmar</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setActivePayment(debt.id)}>Registrar pago</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
          <TabsContent value="payments">
            <div className="grid gap-3">
              {(debts.data || []).map((debt) => (
                <Card key={debt.id}>
                  <CardHeader><CardTitle>Deuda #{debt.id}</CardTitle></CardHeader>
                  <CardContent><PaymentHistory debtId={debt.id} /></CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export function DebtsPage() {
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const customers = useCustomers(search ? { name: search } : undefined)
  const debts = useDebts()
  const debtByCustomer = useMemo(() => {
    const result = new Map<number, number>()
    debts.data?.forEach((debt) => {
      if (debt.status !== 'paid') {
        result.set(debt.customer_id, (result.get(debt.customer_id) || 0) + debt.amount)
      }
    })
    return result
  }, [debts.data])

  return (
    <>
      <PageHeader title="Cuentas corrientes" description="Seguimiento y cobro de saldos por cliente." />
      <div className="mb-4 max-w-md"><Input placeholder="Buscar cliente" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      {customers.isLoading || debts.isLoading ? <LoadingState /> : !customers.data?.length ? <EmptyState title="Sin clientes" /> : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {customers.data.map((customer) => {
            const amount = debtByCustomer.get(customer.id) || 0
            return (
              <div key={customer.id} className="flex flex-col gap-3 border-b border-slate-200 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{customer.name} {customer.last_name}</p>
                  <p className="text-sm text-slate-500">{customer.phone || customer.dni || 'Sin contacto'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <div>{amount > 0 ? <Badge variant="danger">Debe <Money value={amount} /></Badge> : <Badge variant="success">Al día</Badge>}</div>
                  <Button variant="outline" onClick={() => setSelectedCustomer(customer)}>Ver cuenta</Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <AccountDialog customer={selectedCustomer} open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)} />
    </>
  )
}
