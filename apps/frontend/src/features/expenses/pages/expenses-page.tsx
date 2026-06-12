import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { CreateExpensesData, CreateExpensesSchema, UpdateExpensesData } from '@carniceria/shared'
import { PageHeader } from '@/components/common/page-header'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { Money } from '@/components/common/money'
import { DecimalInput } from '@/components/common/decimal-input'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, formatTime } from '@/lib/formatters'
import { Expense } from '../api'
import { useCreateExpense, useDeleteExpense, useExpenses, useUpdateExpense } from '../hooks'

const decimalValue = {
  setValueAs: (value: string) => {
    if (value === '') return 0
    const numberValue = Number(value)
    return Number.isNaN(numberValue) ? 0 : numberValue
  },
}

function ExpenseForm({ onCreated }: { onCreated?: () => void }) {
  const createExpense = useCreateExpense()
  const form = useForm<CreateExpensesData>({
    resolver: zodResolver(CreateExpensesSchema),
    defaultValues: { category: '', amount: 0, description: '' },
  })

  const submit = form.handleSubmit((values) => createExpense.mutate(values, {
    onSuccess: () => {
      form.reset({ category: '', amount: 0, description: '' })
      onCreated?.()
    },
  }))

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2"><Label>Categoría</Label><Input {...form.register('category')} /></div>
      <div className="space-y-2"><Label>Monto</Label><DecimalInput {...form.register('amount', decimalValue)} /></div>
      <div className="space-y-2"><Label>Descripción</Label><Textarea {...form.register('description')} /></div>
      <Button className="w-full" type="submit" disabled={createExpense.isPending}>Registrar gasto</Button>
    </form>
  )
}

function EditExpenseDialog({ expense, open, onOpenChange }: { expense: Expense | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const updateExpense = useUpdateExpense()
  const [form, setForm] = useState<UpdateExpensesData>({})

  function submit() {
    if (!expense) return
    updateExpense.mutate({ id: expense.id, input: form }, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar gasto</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input defaultValue={expense?.category} onChange={(e) => setForm((value) => ({ ...value, category: e.target.value }))} />
          <DecimalInput defaultValue={expense?.amount} onChange={(e) => setForm((value) => ({ ...value, amount: Number(e.target.value) }))} />
          <Textarea defaultValue={expense?.description} onChange={(e) => setForm((value) => ({ ...value, description: e.target.value }))} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={updateExpense.isPending}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ExpensesPage() {
  const [fullHistory, setFullHistory] = useState(false)
  const [search, setSearch] = useState('')
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null)
  const expenses = useExpenses(fullHistory ? undefined : { close_id: 'null' })
  const deleteExpense = useDeleteExpense()
  const filteredExpenses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return expenses.data || []

    return (expenses.data || []).filter((expense) => {
      const values = [
        expense.category,
        expense.description || '',
        expense.amount.toString(),
        formatDate(expense.created_at),
        formatTime(expense.created_at),
        expense.close_id ? 'cerrado' : 'abierto',
      ]

      return values.some((value) => value.toLowerCase().includes(normalizedSearch))
    })
  }, [expenses.data, search])

  return (
    <>
      <PageHeader
        title={fullHistory ? 'Historial de gastos' : 'Gastos activos'}
        description="Registrá gastos del período y administrá movimientos abiertos."
        actions={<Button variant="outline" onClick={() => setFullHistory((value) => !value)}>{fullHistory ? 'Ver activos' : 'Ver historial completo'}</Button>}
      />
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader><CardTitle>Registrar gasto</CardTitle></CardHeader>
          <CardContent><ExpenseForm /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{fullHistory ? 'Todos los gastos' : 'Gastos sin cierre'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Buscar por categoría, descripción, monto o estado" value={search} onChange={(event) => setSearch(event.target.value)} />
            {expenses.isLoading ? <LoadingState /> : !filteredExpenses.length ? <EmptyState title="Sin gastos" description="No hay gastos para los filtros actuales." /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Hora</TableHead><TableHead>Categoría</TableHead><TableHead>Descripción</TableHead><TableHead>Monto</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{formatDate(expense.created_at)}</TableCell>
                      <TableCell>{formatTime(expense.created_at)}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.description || '-'}</TableCell>
                      <TableCell><Money value={expense.amount} /></TableCell>
                      <TableCell>{expense.close_id ? <Badge variant="muted">Cerrado</Badge> : <Badge variant="success">Abierto</Badge>}</TableCell>
                      <TableCell className="text-right">
                        {!expense.close_id ? <Button variant="ghost" size="icon" onClick={() => setExpenseToEdit(expense)}><Pencil className="h-4 w-4" /></Button> : null}
                        {!expense.close_id ? <Button variant="ghost" size="icon" onClick={() => setExpenseToDelete(expense)}><Trash2 className="h-4 w-4" /></Button> : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <ConfirmDialog
        open={!!expenseToDelete}
        onOpenChange={(open) => !open && setExpenseToDelete(null)}
        title="Eliminar gasto"
        description="Esta acción solo se permite para gastos sin cierre."
        confirmLabel="Eliminar"
        isPending={deleteExpense.isPending}
        onConfirm={() => expenseToDelete && deleteExpense.mutate(expenseToDelete.id, { onSuccess: () => setExpenseToDelete(null) })}
      />
      <EditExpenseDialog expense={expenseToEdit} open={!!expenseToEdit} onOpenChange={(open) => !open && setExpenseToEdit(null)} />
    </>
  )
}
