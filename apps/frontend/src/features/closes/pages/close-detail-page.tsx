import { Download } from 'lucide-react'
import { useParams } from 'react-router'
import { PageHeader } from '@/components/common/page-header'
import { LoadingState } from '@/components/common/loading-state'
import { Money } from '@/components/common/money'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatTime, payMethodLabel, saleTotal } from '@/lib/formatters'
import { useCloseReport, useDownloadClosePdf } from '../hooks'

export function CloseDetailPage() {
  const params = useParams()
  const closeId = Number(params.id)
  const report = useCloseReport(closeId)
  const downloadPdf = useDownloadClosePdf()

  if (report.isLoading) return <LoadingState />
  if (!report.data) return <PageHeader title="Cierre no encontrado" />

  const { summary } = report.data

  return (
    <>
      <PageHeader
        title={`Cierre #${closeId}`}
        description={`${formatDate(report.data.close.start_at)} · ${formatTime(report.data.close.start_at)} a ${formatTime(report.data.close.end_at)}`}
        actions={<Button onClick={() => downloadPdf.mutate(closeId)}><Download className="h-4 w-4" /> Descargar PDF</Button>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent><p className="text-sm text-slate-500">Total ventas</p><p className="text-2xl font-semibold"><Money value={summary.totalSales} /></p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Gastos</p><p className="text-2xl font-semibold"><Money value={summary.totalExpenses} /></p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Ingreso real</p><p className="text-2xl font-semibold"><Money value={summary.realIncome} /></p></CardContent></Card>
      </div>
      <div className="mt-5 grid gap-5">
        <Card>
          <CardHeader><CardTitle>Ventas</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Hora</TableHead><TableHead>Pago</TableHead><TableHead>Carne</TableHead><TableHead>Mercadería</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {report.data.sales.all.map((sale) => (
                  <TableRow key={sale.id}><TableCell>{formatTime(sale.created_at)}</TableCell><TableCell>{payMethodLabel(sale.pay_method)}</TableCell><TableCell><Money value={sale.amount_meat} /></TableCell><TableCell><Money value={sale.amount_merchandise} /></TableCell><TableCell><Money value={saleTotal(sale)} /></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Gastos y deudas</CardTitle></CardHeader>
          <CardContent className="grid gap-5 xl:grid-cols-3">
            <div><p className="mb-2 font-medium">Gastos</p>{report.data.expenses.map((expense) => <div key={expense.id} className="flex justify-between border-b py-2 text-sm"><span>{expense.category}</span><Money value={expense.amount} /></div>)}</div>
            <div><p className="mb-2 font-medium">CC generada</p>{report.data.debts.generated.map((debt) => <div key={debt.id} className="flex justify-between border-b py-2 text-sm"><span>Deuda #{debt.id}</span><Money value={debt.amount} /></div>)}</div>
            <div><p className="mb-2 font-medium">Deudas cobradas</p>{report.data.debts.paid.map((payment) => <div key={payment.id} className="flex justify-between border-b py-2 text-sm"><span>{payMethodLabel(payment.pay_method)}</span><Money value={payment.paid_amount} /></div>)}</div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
