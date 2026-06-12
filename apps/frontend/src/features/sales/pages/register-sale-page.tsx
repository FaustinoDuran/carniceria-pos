import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { KeyboardEvent, useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { PageHeader } from '@/components/common/page-header'
import { Money } from '@/components/common/money'
import { DecimalInput } from '@/components/common/decimal-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCustomers } from '@/features/customers/hooks'
import { CreateSaleFormData, CreateSaleFormSchema } from '../schemas'
import { CreateSaleInput } from '../api'
import { useCreateSale } from '../hooks'

const defaultValues: CreateSaleFormData = {
  amount_meat: 0,
  amount_merchandise: 0,
  pay_method: 'cash',
  details: [],
}

const decimalValue = {
  setValueAs: (value: string) => {
    if (value === '') return 0
    const numberValue = Number(value)
    return Number.isNaN(numberValue) ? 0 : numberValue
  },
}

function parseCalculatorInput(value: string): number | null {
  const normalized = value.replace(/\s+/g, '').replace(/,/g, '.')
  if (!normalized) return 0

  if (!/^[+-]?\d+(?:\.\d+)?(?:[+-]\d+(?:\.\d+)?)*$/.test(normalized)) {
    return null
  }

  const terms = normalized.match(/[+-]?\d+(?:\.\d+)?/g)
  if (!terms?.length) return null

  const total = terms.reduce((sum, term) => sum + Number(term), 0)
  return Number.isFinite(total) && total >= 0 ? Number(total.toFixed(2)) : null
}

function formatCalculatorValue(value: number | null | undefined): string {
  const safeValue = Number(value ?? 0)
  if (!Number.isFinite(safeValue) || safeValue === 0) return ''
  return Number.isInteger(safeValue) ? String(safeValue) : safeValue.toFixed(2).replace(/\.?0+$/, '')
}

export function RegisterSalePage() {
  const [useDetails, setUseDetails] = useState(false)
  const customersQuery = useCustomers()
  const createSale = useCreateSale()
  const form = useForm<CreateSaleFormData>({
    resolver: zodResolver(CreateSaleFormSchema) as never,
    defaultValues,
  })
  const details = useFieldArray({ control: form.control, name: 'details' })
  const payMethod = form.watch('pay_method')
  const amountMeat = useWatch({ control: form.control, name: 'amount_meat' })
  const amountMerchandise = useWatch({ control: form.control, name: 'amount_merchandise' })
  const [amountMerchandiseInput, setAmountMerchandiseInput] = useState(() => formatCalculatorValue(defaultValues.amount_merchandise))
  const detailRows = useWatch({ control: form.control, name: 'details' }) || []
  const meatTotal = useMemo(
    () => detailRows.reduce((total, row) => total + Number(row.price_per_kg || 0) * Number(row.weight_kg || 0), 0),
    [detailRows],
  )

  useEffect(() => {
    if (!useDetails) return

    form.setValue('amount_meat', Number(meatTotal.toFixed(2)), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }, [form, meatTotal, useDetails])

  useEffect(() => {
    setAmountMerchandiseInput(formatCalculatorValue(amountMerchandise))
  }, [amountMerchandise])

  function commitAmountMerchandise(rawValue: string) {
    const parsedValue = parseCalculatorInput(rawValue)
    if (parsedValue === null) {
      setAmountMerchandiseInput(formatCalculatorValue(amountMerchandise))
      return
    }

    form.setValue('amount_merchandise', parsedValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    setAmountMerchandiseInput(formatCalculatorValue(parsedValue))
  }

  function handleAmountMerchandiseKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    commitAmountMerchandise(event.currentTarget.value)
    event.currentTarget.blur()
  }

  const onSubmit = form.handleSubmit((values) => {
    const payload: CreateSaleInput = {
      ...values,
      amount_meat: useDetails ? Number(meatTotal.toFixed(2)) : Number(values.amount_meat || 0),
      amount_merchandise: Number(values.amount_merchandise || 0),
      pay_method: values.pay_method,
      details: useDetails ? values.details : undefined,
      customer_id: values.customer_id ? Number(values.customer_id) : undefined,
    }

    createSale.mutate(payload, {
      onSuccess: () => {
        form.reset(defaultValues)
        details.replace([])
        setUseDetails(false)
      },
    })
  })

  return (
    <>
      <PageHeader title="Registrar venta" description="Carga rápida de ventas de carne, mercadería y cuenta corriente." />
      <form onSubmit={onSubmit} className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Datos de la venta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Monto carne</Label>
                <DecimalInput disabled={useDetails} {...form.register('amount_meat', decimalValue)} />
                {form.formState.errors.amount_meat ? <p className="text-xs text-red-600">{form.formState.errors.amount_meat.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label>Monto mercadería</Label>
                <Input
                  inputMode="decimal"
                  placeholder="Ej: 1500+300+4200"
                  value={amountMerchandiseInput}
                  onChange={(event) => setAmountMerchandiseInput(event.target.value.replace(/[^\d+\-.,\s]/g, ''))}
                  onBlur={(event) => commitAmountMerchandise(event.currentTarget.value)}
                  onKeyDown={handleAmountMerchandiseKeyDown}
                />
                <p className="text-xs text-slate-500">Podés escribir sumas directas, por ejemplo `1500+300+4200`.</p>
              </div>
              <div className="space-y-2">
                <Label>Método de pago</Label>
                <Select value={payMethod} onValueChange={(value) => form.setValue('pay_method', value as CreateSaleFormData['pay_method'])}>
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
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={form.watch('customer_id')?.toString() || ''} onValueChange={(value) => form.setValue('customer_id', Number(value), { shouldValidate: true })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {customersQuery.data?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} {customer.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.customer_id ? <p className="text-xs text-red-600">{form.formState.errors.customer_id.message}</p> : null}
              </div>
            ) : null}

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={useDetails} onChange={(event) => setUseDetails(event.target.checked)} />
              Agregar detalle de cortes
            </label>

            {useDetails ? (
              <div className="space-y-3">
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
                    {details.fields.map((field, index) => {
                      const row = detailRows[index]
                      const subtotal = Number(row?.price_per_kg || 0) * Number(row?.weight_kg || 0)
                      return (
                        <TableRow key={field.id}>
                          <TableCell><Input {...form.register(`details.${index}.cut_name`)} /></TableCell>
                          <TableCell><DecimalInput {...form.register(`details.${index}.price_per_kg`, decimalValue)} /></TableCell>
                          <TableCell><DecimalInput {...form.register(`details.${index}.weight_kg`, decimalValue)} /></TableCell>
                          <TableCell className="text-right"><Money value={subtotal} /></TableCell>
                          <TableCell className="text-right">
                            <Button type="button" variant="ghost" size="icon" onClick={() => details.remove(index)}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between">
                  <Button type="button" variant="outline" onClick={() => details.append({ cut_name: '', price_per_kg: 0, weight_kg: 0 })}>
                    <Plus className="h-4 w-4" /> Agregar corte
                  </Button>
                  <div className="text-sm font-semibold">Total carne: <Money value={meatTotal} /></div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Total a registrar</p>
              <p className="text-3xl font-semibold text-slate-950">
                <Money value={(useDetails ? meatTotal : Number(amountMeat || 0)) + Number(amountMerchandise || 0)} />
              </p>
            </div>
            <Button className="w-full" type="submit" disabled={createSale.isPending}>
              Registrar venta
            </Button>
          </CardContent>
        </Card>
      </form>
    </>
  )
}
