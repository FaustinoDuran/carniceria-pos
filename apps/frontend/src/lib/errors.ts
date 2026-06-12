import { AxiosError } from 'axios'

interface ApiErrorBody {
  error?: {
    message?: string
    code?: string
    details?: Array<{ path?: string; message?: string }>
    requestId?: string
  }
}

const friendlyMessages: Record<string, string> = {
  'DNI already taken': 'Ya existe un cliente con ese DNI.',
  'Customer not found': 'No se encontró el cliente.',
  'Customer could not be updated': 'No se pudo actualizar el cliente.',
  'Customer has active debts and cannot be deleted': 'No podés eliminar este cliente porque tiene deudas activas.',
  'Customer is not deleted': 'Este cliente no está eliminado.',
  'Customer could not be restored': 'No se pudo restaurar el cliente.',

  'Sale not found': 'No se encontró la venta.',
  'Cannot delete a closed sale': 'No podés eliminar una venta que ya fue cerrada.',
  'Cannot delete a sale with current account debt': 'No podés eliminar una venta en cuenta corriente mientras tenga una deuda asociada.',
  'Cannot delete a sale with recorded debt payments': 'No podés eliminar una venta en cuenta corriente si la deuda ya recibió pagos.',
  'Cannot update a sale with current account debt': 'No podés editar una venta en cuenta corriente porque tiene deuda o pagos asociados.',
  'Sale could not be deleted': 'No se pudo eliminar la venta.',
  'Cannot update a closed sale': 'No podés editar una venta que ya fue cerrada.',
  'Sale could not be updated': 'No se pudo actualizar la venta.',
  'Customer ID is required for cc sale': 'Seleccioná un cliente para registrar la venta en cuenta corriente.',
  'El remito solo se puede imprimir para ventas con detalle de cortes': 'El remito solo se puede imprimir para ventas con detalle de cortes.',

  'Expense not found': 'No se encontró el gasto.',
  'Cannot create expense without an active close': 'No hay una caja abierta para registrar el gasto.',
  'Cannot update a closed expense': 'No podés editar un gasto que ya fue cerrado.',
  'Cannot delete a closed expense': 'No podés eliminar un gasto que ya fue cerrado.',
  'Expense could not be deleted': 'No se pudo eliminar el gasto.',
  'Expense could not be updated': 'No se pudo actualizar el gasto.',

  'Debt not found': 'No se encontró la deuda.',
  'Cannot record debt payment without an active close': 'No hay una caja abierta para registrar el pago.',
  'Debt payment could not be recorded': 'No se pudo registrar el pago. Revisá el monto y el estado de la deuda.',

  'There is already an active close': 'Ya hay una caja abierta.',
  'There is no active close to finish': 'No hay una caja abierta para cerrar.',
  'Close is already finished': 'Esta caja ya fue cerrada.',
  'Close must have sales or expenses registered': 'No se puede cerrar una caja sin ventas ni gastos.',
  'Close could not be finished': 'No se pudo cerrar la caja.',
  'Close not found': 'No se encontró la caja.',
  'Closes not found': 'No se encontraron cierres para esos filtros.',
  'Close report can only be generated for finished closes': 'El reporte solo se puede generar para cajas cerradas.',

  'Operation cannot be completed because related records exist': 'No se puede completar la operación porque hay movimientos relacionados.',
  'A record with the same unique value already exists': 'Ya existe un registro con ese dato.',
}

const statusMessages: Record<number, string> = {
  400: 'Revisá los datos cargados.',
  404: 'No se encontró el recurso solicitado.',
  409: 'La operación no se puede realizar por reglas del sistema.',
  500: 'Ocurrió un problema en el servidor. Intentá nuevamente.',
}

const technicalMessagePatterns = [
  /violates foreign key constraint/i,
  /duplicate key value/i,
  /syntax error/i,
  /relation .* does not exist/i,
  /column .* does not exist/i,
  /null value in column/i,
  /insert or update on table/i,
  /update or delete on table/i,
  /SQL/i,
]

function isTechnicalMessage(message: string): boolean {
  return technicalMessagePatterns.some((pattern) => pattern.test(message))
}

function getFriendlyApiMessage(code?: string, message?: string, status?: number): string {
  if (message && friendlyMessages[message]) {
    return friendlyMessages[message]
  }

  if (code === 'VALIDATION_ERROR') {
    return 'Revisá los datos cargados antes de continuar.'
  }

  if (code === 'NOT_FOUND') {
    return statusMessages[404]
  }

  if (code === 'INTERNAL_SERVER_ERROR') {
    return statusMessages[500]
  }

  if (message && !isTechnicalMessage(message) && code === 'BUSINESS_ERROR') {
    return statusMessages[409]
  }

  if (status && statusMessages[status]) {
    return statusMessages[status]
  }

  return 'Ocurrió un error inesperado. Intentá nuevamente.'
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorBody | undefined
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Verificá que el backend esté levantado.'
    }

    return getFriendlyApiMessage(data?.error?.code, data?.error?.message, error.response.status)
  }

  if (error instanceof Error) {
    if (isTechnicalMessage(error.message)) {
      return 'Ocurrió un problema técnico. Intentá nuevamente.'
    }

    return error.message || 'Ocurrió un error inesperado'
  }

  return 'Ocurrió un error inesperado'
}
