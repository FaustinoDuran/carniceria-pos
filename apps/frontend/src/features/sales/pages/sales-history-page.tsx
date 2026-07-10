import { ChevronDown, Pencil, Plus, Printer, Trash2 } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/page-header'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { Money } from '@/components/common/money'
import { DecimalInput } from '@/components/common/decimal-input'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { formatDate, formatTime, payMethodLabel, saleTotal } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errors'
import { useCustomers } from '@/features/customers/hooks'
import { getSaleRemitoPdf, Sale, SaleDetail } from '../api'
import { useDeleteSale, useSaleDetails, useSales, useUpdateSale } from '../hooks'

function SaleDetailsRow({ saleId }: { saleId: number }) {
  const details = useSaleDetails(saleId)
  if (details.isLoading) return <div className="p-3 text-sm text-slate-500">Cargando detalles...</div>
  if (!details.data?.length) return <div className="p-3 text-sm text-slate-500">Sin detalle de cortes.</div>
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <div className="grid grid-cols-4 gap-2 text-xs font-medium uppercase text-slate-500">
        <span>Corte</span><span>Precio kg</span><span>Peso</span><span className="text-right">Subtotal</span>
      </div>
      {details.data.map((detail) => (
        <div key={detail.id} className="grid grid-cols-4 gap-2 border-t border-slate-200 py-2 text-sm">
          <span>{detail.cut_name}</span>
          <Money value={detail.price_per_kg} />
          <span>{detail.weight_kg} kg</span>
          <span className="text-right"><Money value={detail.subtotal} /></span>
        </div>
      ))}
    </div>
  )
}

type EditableSaleDetail = Pick<SaleDetail, 'cut_name' | 'price_per_kg' | 'weight_kg'>

function calculateDetailTotal(details: EditableSaleDetail[]) {
  return details.reduce((total, detail) => total + Number(detail.price_per_kg || 0) * Number(detail.weight_kg || 0), 0)
}

function EditSaleDialog({ sale, open, onOpenChange }: { sale: Sale | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const updateSale = useUpdateSale()
  const saleDetails = useSaleDetails(sale?.id ?? 0, open && !!sale)
  const customersQuery = useCustomers(undefined)
  const [amountMeat, setAmountMeat] = useState(sale?.amount_meat ?? 0)
  const [amountMerchandise, setAmountMerchandise] = useState(sale?.amount_merchandise ?? 0)
  const [payMethod, setPayMethod] = useState<Sale['pay_method']>(sale?.pay_method ?? 'cash')
  const [customerId, setCustomerId] = useState<number | undefined>(undefined)
  const [editableDetails, setEditableDetails] = useState<EditableSaleDetail[]>([])
  const [detailsMode, setDetailsMode] = useState(false)
  const [detailsRequired, setDetailsRequired] = useState(false)
  const detailTotal = useMemo(() => calculateDetailTotal(editableDetails), [editableDetails])
  const editsDetails = detailsMode
  const requiresCustomer = payMethod === 'cc' && sale?.pay_method !== 'cc'

  useEffect(() => {
    if (!sale || !open) return

    setAmountMeat(sale.amount_meat)
    setAmountMerchandise(sale.amount_merchandise)
    setPayMethod(sale.pay_method)
    setCustomerId(undefined)
    setEditableDetails([])
    setDetailsMode(false)
    setDetailsRequired(false)
  }, [sale, open])

  useEffect(() => {
    if (!sale || !open || saleDetails.isLoading) return

    const rows = saleDetails.data || []
    setDetailsMode(rows.length > 0)
    setDetailsRequired(rows.length > 0)
    setEditableDetails(rows.map((detail) => ({
      cut_name: detail.cut_name,
      price_per_kg: detail.price_per_kg,
      weight_kg: detail.weight_kg,
    })))
  }, [sale, open, saleDetails.data, saleDetails.isLoading])

  function submit() {
    if (!sale) return
    const nextAmountMeat = editsDetails ? Number(detailTotal.toFixed(2)) : amountMeat

    updateSale.mutate({
      id: sale.id,
      input: {
        amount_meat: nextAmountMeat,
        amount_merchandise: amountMerchandise,
        pay_method: payMethod,
        customer_id: customerId,
        details: editsDetails ? editableDetails : undefined,
      },
    }, {
      onSuccess: () => onOpenChange(false),
    })
  }

  function updateDetail(index: number, patch: Partial<EditableSaleDetail>) {
    setEditableDetails((current) => current.map((detail, detailIndex) => (
      detailIndex === index ? { ...detail, ...patch } : detail
    )))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar venta</DialogTitle></DialogHeader>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Carne</Label>
            <DecimalInput disabled={editsDetails} value={editsDetails ? Number(detailTotal.toFixed(2)) : amountMeat} onChange={(e) => setAmountMeat(Number(e.target.value))} />
          </div>
          <div className="space-y-2"><Label>Mercadería</Label><DecimalInput value={amountMerchandise} onChange={(e) => setAmountMerchandise(Number(e.target.value))} /></div>
          <div className="space-y-2">
            <Label>Pago</Label>
            <Select value={payMethod} onValueChange={(value) => setPayMethod(value as Sale['pay_method'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="credit">Crédito</SelectItem>
                <SelectItem value="debit">Débito</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="cc">Cuenta corriente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {payMethod === 'cc' ? (
          <div className="mt-4 space-y-2">
            <Label>Cliente</Label>
            <Select value={customerId?.toString() || ''} onValueChange={(value) => setCustomerId(Number(value))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
              <SelectContent>
                {customersQuery.data?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name} {customer.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {requiresCustomer && !customerId ? <p className="text-sm text-red-600">Seleccioná un cliente para pasar la venta a cuenta corriente.</p> : null}
          </div>
        ) : null}

        {saleDetails.isLoading ? <LoadingState /> : editsDetails ? (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-950">Detalle de cortes</p>
                <p className="text-xs text-slate-500">Cuando una venta tiene cortes, el monto de carne se calcula desde este detalle.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setDetailsMode(true)
                  setEditableDetails((current) => [...current, { cut_name: '', price_per_kg: 0, weight_kg: 0 }])
                }}
              >
                <Plus className="h-4 w-4" /> Agregar corte
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Corte</TableHead>
                  <TableHead>Precio kg</TableHead>
                  <TableHead>Peso kg</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {editableDetails.map((detail, index) => {
                  const subtotal = Number(detail.price_per_kg || 0) * Number(detail.weight_kg || 0)
                  return (
                    <TableRow key={index}>
                      <TableCell><Input value={detail.cut_name} onChange={(event) => updateDetail(index, { cut_name: event.target.value })} /></TableCell>
                      <TableCell><DecimalInput value={detail.price_per_kg} onChange={(event) => updateDetail(index, { price_per_kg: Number(event.target.value) })} /></TableCell>
                      <TableCell><DecimalInput value={detail.weight_kg} onChange={(event) => updateDetail(index, { weight_kg: Number(event.target.value) })} /></TableCell>
                      <TableCell className="text-right"><Money value={subtotal} /></TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="ghost" size="icon" onClick={() => setEditableDetails((current) => current.filter((_, detailIndex) => detailIndex !== index))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {detailsRequired && editableDetails.length === 0 ? <p className="text-sm text-red-600">Esta venta tenía detalle de cortes, dejá al menos uno cargado.</p> : null}
          </div>
        ) : (
          <div className="mt-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDetailsMode(true)
                setEditableDetails([{ cut_name: '', price_per_kg: 0, weight_kg: 0 }])
              }}
            >
              <Plus className="h-4 w-4" /> Agregar detalle de cortes
            </Button>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={submit}
            disabled={updateSale.isPending || (detailsRequired && editableDetails.length === 0) || (requiresCustomer && !customerId)}
          >
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SalesHistoryPage() {
  const [fullHistory, setFullHistory] = useState(false)
  const [payMethod, setPayMethod] = useState<string>('all')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null)
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null)
  const [printingSaleId, setPrintingSaleId] = useState<number | null>(null)
  const filters = {
    date: fullHistory ? undefined : 'today',
    close_id: fullHistory ? undefined : 'null' as const,
    pay_method: payMethod === 'all' ? undefined : payMethod,
  }
  const sales = useSales(filters)
  const saleRows = sales.data?.pages.flat() ?? []
  const deleteSale = useDeleteSale()

  async function handlePrintRemito(sale: Sale) {
    const printWindow = window.open('', '_blank')
    setPrintingSaleId(sale.id)

    if (printWindow) {
      printWindow.document.write('<!doctype html><title>Remito</title><p>Preparando remito...</p>')
    }

    try {
      const pdf = await getSaleRemitoPdf(sale.id)
      const url = URL.createObjectURL(pdf)

      if (!printWindow) {
        const link = document.createElement('a')
        link.href = url
        link.download = `remito-venta-${sale.id}.pdf`
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        toast.success('Remito listo para imprimir')
        return
      }

      printWindow.location.href = url
      printWindow.addEventListener('load', () => {
        try {
          printWindow?.focus()
          printWindow?.print()
        } catch {
          // Some PDF viewers do not expose print control to the opener.
        }
      }, { once: true })
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      toast.success('Remito listo para imprimir')
    } catch (error) {
      if (printWindow && !printWindow.closed) {
        printWindow.close()
      }
      toast.error(getErrorMessage(error))
    } finally {
      setPrintingSaleId(null)
    }
  }

  return (
    <>
      <PageHeader
        title={fullHistory ? 'Historial de ventas' : 'Ventas de hoy sin cierre'}
        description="Consulta, edita o elimina ventas que todavía no fueron cerradas."
        actions={<Button variant="outline" onClick={() => setFullHistory((value) => !value)}>{fullHistory ? 'Volver a hoy' : 'Ver historial completo'}</Button>}
      />
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Input className="max-w-xs" placeholder="Buscar visualmente por monto o método" />
            <Select value={payMethod} onValueChange={setPayMethod}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="credit">Crédito</SelectItem>
                <SelectItem value="debit">Débito</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="cc">Cuenta corriente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {sales.isLoading ? <LoadingState /> : !saleRows.length ? <EmptyState title="Sin ventas" description="No hay ventas para los filtros actuales." /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead><TableHead>Carne</TableHead><TableHead>Mercadería</TableHead><TableHead>Total</TableHead><TableHead>Pago</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saleRows.map((sale) => (
                  <Fragment key={sale.id}>
                    <TableRow key={sale.id}>
                      <TableCell>{formatDate(sale.created_at)} {formatTime(sale.created_at)}</TableCell>
                      <TableCell><Money value={sale.amount_meat} /></TableCell>
                      <TableCell><Money value={sale.amount_merchandise} /></TableCell>
                      <TableCell className="font-medium"><Money value={saleTotal(sale)} /></TableCell>
                      <TableCell>{payMethodLabel(sale.pay_method)}</TableCell>
                      <TableCell>{sale.close_id ? <Badge variant="muted">Cerrada</Badge> : <Badge variant="success">Abierta</Badge>}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}><ChevronDown className="h-4 w-4" /></Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Imprimir remito"
                          disabled={printingSaleId === sale.id}
                          onClick={() => handlePrintRemito(sale)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        {!sale.close_id ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={sale.pay_method === 'cc'}
                            title={sale.pay_method === 'cc' ? 'No se puede editar: tiene cuenta corriente asociada' : 'Editar venta'}
                            onClick={() => setSaleToEdit(sale)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        ) : null}
                        {!sale.close_id ? <Button variant="ghost" size="icon" onClick={() => setSaleToDelete(sale)}><Trash2 className="h-4 w-4" /></Button> : null}
                      </TableCell>
                    </TableRow>
                    {expanded === sale.id ? <TableRow><TableCell colSpan={7}><SaleDetailsRow saleId={sale.id} /></TableCell></TableRow> : null}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
          {sales.hasNextPage ? (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={() => sales.fetchNextPage()} disabled={sales.isFetchingNextPage}>
                {sales.isFetchingNextPage ? 'Cargando...' : 'Ver más'}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={!!saleToDelete}
        onOpenChange={(open) => !open && setSaleToDelete(null)}
        title="Eliminar venta"
        description="Esta acción solo se permite para ventas sin cierre."
        confirmLabel="Eliminar"
        isPending={deleteSale.isPending}
        onConfirm={() => saleToDelete && deleteSale.mutate(saleToDelete.id, { onSuccess: () => setSaleToDelete(null) })}
      />
      <EditSaleDialog sale={saleToEdit} open={!!saleToEdit} onOpenChange={(open) => !open && setSaleToEdit(null)} />
    </>
  )
}
