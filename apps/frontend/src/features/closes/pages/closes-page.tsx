import { Download, Eye, LockKeyhole, Play, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/common/page-header'
import { LoadingState } from '@/components/common/loading-state'
import { EmptyState } from '@/components/common/empty-state'
import { Money } from '@/components/common/money'
import { DecimalInput } from '@/components/common/decimal-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatTime } from '@/lib/formatters'
import { useActiveClose, useCloses, useDownloadClosePdf, useFinishClose, useStartClose } from '../hooks'

function FinishCloseDialog({ closeId, open, onOpenChange }: { closeId: number | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [expectedCash, setExpectedCash] = useState<number | null>(null)
  const finishClose = useFinishClose()

  function submit() {
    if (!closeId) return
    finishClose.mutate({ id: closeId, expected_cash: expectedCash }, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Cerrar caja</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Se cerrarán todas las ventas y gastos abiertos del período.</p>
          <div className="space-y-2">
            <Label>Efectivo físico en caja</Label>
            <DecimalInput onChange={(e) => setExpectedCash(e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={submit} disabled={finishClose.isPending}>Confirmar cierre</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ClosesPage() {
  const activeClose = useActiveClose()
  const startClose = useStartClose()
  const downloadPdf = useDownloadClosePdf()
  const [finishOpen, setFinishOpen] = useState(false)
  const [exactDate, setExactDate] = useState('')
  const [month, setMonth] = useState('')

  const hasFilter = Boolean(exactDate || month)
  const closes = useCloses({
    start_at: exactDate || undefined,
    month: month || undefined,
  })
  const closeRows = closes.data?.pages.flat() ?? []

  return (
    <>
      <PageHeader title="Cierre de caja" description="Control del turno actual, historial y reportes." />
      <div className="grid gap-5">
        <Card>
          <CardHeader><CardTitle>Estado actual</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            {activeClose.isLoading ? <LoadingState /> : activeClose.data ? (
              <>
                <div>
                  <p className="font-semibold text-slate-950">Caja abierta desde {formatTime(activeClose.data.start_at)}</p>
                  <p className="text-sm text-slate-500">{formatDate(activeClose.data.start_at)}</p>
                </div>
                <Button variant="destructive" onClick={() => setFinishOpen(true)}><LockKeyhole className="h-4 w-4" /> Cerrar caja</Button>
              </>
            ) : (
              <>
                <div>
                  <p className="font-semibold text-slate-950">No hay caja abierta</p>
                  <p className="text-sm text-slate-500">Se abrirá automáticamente con la primera venta o podés abrirla ahora.</p>
                </div>
                <Button onClick={() => startClose.mutate()} disabled={startClose.isPending}><Play className="h-4 w-4" /> Abrir caja</Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Historial de cierres</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Fecha exacta</Label>
                <Input
                  type="date"
                  className="w-44"
                  value={exactDate}
                  onChange={(e) => { setExactDate(e.target.value); setMonth('') }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Mes / Año</Label>
                <Input
                  type="month"
                  className="w-44"
                  value={month}
                  onChange={(e) => { setMonth(e.target.value); setExactDate('') }}
                />
              </div>
              {hasFilter ? (
                <Button variant="outline" size="sm" onClick={() => { setExactDate(''); setMonth('') }}>
                  <X className="h-4 w-4" /> Limpiar
                </Button>
              ) : null}
            </div>
            {closes.isLoading ? <LoadingState /> : closeRows.length === 0 ? (
              <EmptyState
                title="Sin cierres"
                description={hasFilter ? 'No hay cierres para el filtro seleccionado.' : 'Todavía no hay cierres registrados.'}
              />
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Apertura</TableHead><TableHead>Cierre</TableHead><TableHead>Ingresos</TableHead><TableHead>Gastos</TableHead><TableHead>Balance</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {closeRows.map((close) => (
                    <TableRow key={close.id}>
                      <TableCell>{formatDate(close.start_at)}</TableCell>
                      <TableCell>{formatTime(close.start_at)}</TableCell>
                      <TableCell>{close.end_at ? formatTime(close.end_at) : 'Abierta'}</TableCell>
                      <TableCell><Money value={close.total_income} /></TableCell>
                      <TableCell><Money value={close.total_expense} /></TableCell>
                      <TableCell><Money value={close.total_income - close.total_expense} /></TableCell>
                      <TableCell className="text-right">
                        <Link className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100" to={`/cierres/${close.id}`}><Eye className="h-4 w-4" /></Link>
                        {close.end_at ? <Button variant="ghost" size="icon" onClick={() => downloadPdf.mutate(close.id)}><Download className="h-4 w-4" /></Button> : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {closes.hasNextPage ? (
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={() => closes.fetchNextPage()} disabled={closes.isFetchingNextPage}>
                  {closes.isFetchingNextPage ? 'Cargando...' : 'Ver más'}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <FinishCloseDialog closeId={activeClose.data?.id || null} open={finishOpen} onOpenChange={setFinishOpen} />
    </>
  )
}
