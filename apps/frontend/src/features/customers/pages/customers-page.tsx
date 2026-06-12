import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, RotateCcw, Trash2, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { CreateCustomerData, CreateCustomerSchema, UpdateCustomerData, UpdateCustomerSchema } from '@carniceria/shared'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/formatters'
import { useDebts } from '@/features/debts/hooks'
import { Customer } from '../api'
import { useCreateCustomer, useCustomers, useDeleteCustomer, useDeletedCustomers, useRestoreCustomer, useUpdateCustomer } from '../hooks'

function CustomerDialog({ customer, open, onOpenChange }: { customer?: Customer | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const form = useForm<CreateCustomerData | UpdateCustomerData>({
    resolver: zodResolver(customer ? UpdateCustomerSchema : CreateCustomerSchema),
    values: customer ? {
      name: customer.name,
      last_name: customer.last_name,
      phone: customer.phone,
      dni: customer.dni,
    } : {
      name: '',
      last_name: '',
      phone: '',
      dni: '',
    },
  })

  const submit = form.handleSubmit((values) => {
    if (customer) {
      updateCustomer.mutate({ id: customer.id, input: values }, { onSuccess: () => onOpenChange(false) })
      return
    }
    createCustomer.mutate(values as CreateCustomerData, { onSuccess: () => onOpenChange(false) })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{customer ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Nombre</Label><Input {...form.register('name')} /></div>
          <div className="space-y-2"><Label>Apellido</Label><Input {...form.register('last_name')} /></div>
          <div className="space-y-2"><Label>Teléfono</Label><Input {...form.register('phone')} /></div>
          <div className="space-y-2"><Label>DNI</Label><Input {...form.register('dni')} /></div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createCustomer.isPending || updateCustomer.isPending}>Guardar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CustomerTable({ customers, deleted, activeDebtCustomerIds, debtStateLoading, onEdit, onDelete, onRestore }: {
  customers: Customer[]
  deleted?: boolean
  activeDebtCustomerIds?: Set<number>
  debtStateLoading?: boolean
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  onRestore: (customer: Customer) => void
}) {
  if (!customers.length) return <EmptyState title={deleted ? 'Sin clientes eliminados' : 'Sin clientes'} />

  return (
    <Table>
      <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Teléfono</TableHead><TableHead>DNI</TableHead><TableHead>Registro</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
      <TableBody>
        {customers.map((customer) => {
          const hasActiveDebt = activeDebtCustomerIds?.has(customer.id) ?? false
          const deleteDisabled = debtStateLoading || hasActiveDebt

          return (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.name} {customer.last_name}</TableCell>
              <TableCell>{customer.phone || '-'}</TableCell>
              <TableCell>{customer.dni || '-'}</TableCell>
              <TableCell>{formatDate(customer.created_at)}</TableCell>
              <TableCell className="text-right">
                {deleted ? (
                  <Button variant="ghost" size="icon" onClick={() => onRestore(customer)}><RotateCcw className="h-4 w-4" /></Button>
                ) : (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(customer)}><Pencil className="h-4 w-4" /></Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deleteDisabled}
                      title={hasActiveDebt ? 'No se puede eliminar: tiene deuda activa' : 'Eliminar cliente'}
                      onClick={() => onDelete(customer)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState<Customer | null>(null)
  const filters = search ? (/^\d+$/.test(search) ? { dni: search } : { name: search }) : undefined
  const customers = useCustomers(filters)
  const deletedCustomers = useDeletedCustomers(filters)
  const debts = useDebts()
  const activeDebtCustomerIds = useMemo(() => {
    const ids = new Set<number>()
    debts.data?.forEach((debt) => {
      if (debt.status !== 'paid') {
        ids.add(debt.customer_id)
      }
    })
    return ids
  }, [debts.data])
  const deleteCustomer = useDeleteCustomer()
  const restoreCustomer = useRestoreCustomer()

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Administrá clientes para ventas y cuentas corrientes."
        actions={<Button onClick={() => { setEditing(null); setDialogOpen(true) }}><UserPlus className="h-4 w-4" /> Nuevo cliente</Button>}
      />
      <Card>
        <CardContent className="space-y-4">
          <Input placeholder="Buscar por nombre, apellido o DNI" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Tabs defaultValue="active">
            <TabsList><TabsTrigger value="active">Activos</TabsTrigger><TabsTrigger value="deleted">Eliminados</TabsTrigger></TabsList>
            <TabsContent value="active">
              {customers.isLoading ? <LoadingState /> : (
                <CustomerTable
                  customers={customers.data || []}
                  activeDebtCustomerIds={activeDebtCustomerIds}
                  debtStateLoading={debts.isLoading}
                  onEdit={(customer) => { setEditing(customer); setDialogOpen(true) }}
                  onDelete={setDeleting}
                  onRestore={(customer) => restoreCustomer.mutate(customer.id)}
                />
              )}
            </TabsContent>
            <TabsContent value="deleted">
              {deletedCustomers.isLoading ? <LoadingState /> : (
                <CustomerTable
                  deleted
                  customers={deletedCustomers.data || []}
                  onEdit={(customer) => { setEditing(customer); setDialogOpen(true) }}
                  onDelete={setDeleting}
                  onRestore={(customer) => restoreCustomer.mutate(customer.id)}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <CustomerDialog customer={editing} open={dialogOpen} onOpenChange={setDialogOpen} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar cliente"
        description="El cliente se ocultará de las búsquedas activas. No se eliminará definitivamente."
        confirmLabel="Eliminar"
        isPending={deleteCustomer.isPending}
        onConfirm={() => deleting && deleteCustomer.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  )
}
