# CONVENTIONS.md

Este documento recoge la estructura y convenciones reales observadas en services/backend/src sin modificar código existente.

## 1) Estructura real de carpetas en features

### Patrón repetido por feature

Las features principales siguen este esquema:

- featureName.routes.ts
- featureName.controller.ts
- featureName.service.interface.ts
- featureName.service.ts
- featureName.repository.ts
- models/
  - featureName.model.ts
  - featureName.dto.ts (o varias DTOs: por ejemplo ExpenseDTO / UpdateExpenseDTO)

### Inventario por feature

#### closes

Archivos consistentes / repetidos:
- close.routes.ts
- close.controller.ts
- close.service.interface.ts
- close.service.ts
- close.repository.ts
- models/close.model.ts
- models/openClose.model.ts
- models/finishClose.model.ts
- close.utils.ts
- types.ts

Archivos específicos / singulares:
- close-report-pdf.service.ts

Observaciones:
- Es la única feature con un flujo de estado explícito: open/finish.
- Tiene un tipo de reporte y un servicio de PDF específico para cierres.

#### customers

Archivos consistentes / repetidos:
- customer.routes.ts
- customer.controller.ts
- customer.service.interface.ts
- customer.service.ts
- customer.repository.ts
- models/customer.model.ts
- models/customer.dto.ts

Archivos específicos / singulares:
- Ninguno evidente; la feature es muy lineal.

#### debts

Archivos consistentes / repetidos:
- debt.routes.ts
- debt.controller.ts
- debt.service.interface.ts
- debt.service.ts
- debt.repository.ts
- models/debt.model.ts
- models/debt.dto.ts

Archivos específicos / singulares:
- models/recordDebtPayment.model.ts
- models/debtPaymentEvent.model.ts

Observaciones:
- Tiene un subflujo de pagos de deuda con eventos asociados.
- El repository maneja tanto deudas como eventos de pago.

#### expenses

Archivos consistentes / repetidos:
- expense.routes.ts
- expense.controller.ts
- expense.service.interface.ts
- expense.service.ts
- expense.repository.ts
- models/expense.model.ts
- models/expense.dto.ts

Archivos específicos / singulares:
- Ninguno evidente.

#### sales

Archivos consistentes / repetidos:
- sale.routes.ts
- sale.controller.ts
- sale.service.interface.ts
- sale.service.ts
- sale.repository.ts
- models/sale.model.ts
- models/sale.dto.ts

Archivos específicos / singulares:
- sale-remito-pdf.service.ts
- types.d.ts

Observaciones:
- Tiene un servicio PDF adicional para remitos.
- El controller maneja body con detalles de venta y customer_id extra.

#### sale-details

Archivos consistentes / repetidos:
- models/sale-detail.model.ts
- models/sale-detail.dto.ts
- sale-detail.repository.ts

Archivos específicos / singulares:
- No hay service/controller/routes propios.

Observaciones:
- Es una feature de soporte utilizada por sales; no tiene interfaz de servicio ni router independiente.

### Conclusión de la estructura

El patrón dominante es:
- una feature = router + controller + service + repository + models

Los archivos que no encajan bien en ese patrón son:
- servicios auxiliares de PDF: close-report-pdf.service.ts y sale-remito-pdf.service.ts
- tipos de reportes / estructuras de salida: closes/types.ts y sales/types.d.ts
- modelos de soporte específicos a un flujo de negocio (recordDebtPayment, debtPaymentEvent)

No existe ninguna carpeta feature con index.ts como barrel export.

## 2) Convención de clases y dependencias reales

### A. closes

Interface real del service:

```ts
export interface ICloseService {
  start(): Promise<Close>
  finish(id: number, input?: FinishCloseInput): Promise<Close>
  search(filters?: CloseFilters): Promise<Close[]>
  getById(id: number): Promise<Close>
  getActive(): Promise<Close | null>
  getReportData(id: number): Promise<CloseReportData>
}
```

Clase del service real:

```ts
export class CloseService implements ICloseService {
  async start(): Promise<Close> { ... }
  async finish(id: number, input?: FinishCloseInput): Promise<Close> { ... }
  async search(filters?: CloseFilters): Promise<Close[]> { ... }
  async getById(id: number): Promise<Close> { ... }
  async getActive(): Promise<Close | null> { ... }
  async getReportData(id: number): Promise<CloseReportData> { ... }
}

export const closeService = new CloseService()
```

Repository real:

```ts
export class CloseRepository {
  async create(data: OpenClose, client?: PoolClient): Promise<Close> { ... }
  async getAll(filters?: CloseFilters, client?: PoolClient): Promise<Close[]> { ... }
  async getById(id: number, client?: PoolClient): Promise<Close | null> { ... }
  async getActive(client?: PoolClient): Promise<Close | null> { ... }
  async finish(id: number, dto: FinishClose, client?: PoolClient): Promise<Close | null> { ... }
}

export const closeRepository = new CloseRepository()
```

Controller real:

```ts
export const closeController = {
  async start(req, res) { ... },
  async search(req, res) { ... },
  async getActive(req, res) { ... },
  async getById(req, res) { ... },
  async finish(req, res) { ... },
  async getReport(req, res) { ... },
  async downloadPDF(req, res) { ... },
}
```

Inyección de dependencias:
- No hay constructor injection.
- No hay contenedor DI.
- No hay factory functions.
- El service importa directamente repositorios concretos y crea una instancia singleton exportada.
- El controller usa la instancia singleton del service directamente.

### B. expenses

Interface real:

```ts
export interface IExpensesServies {
  create(data: unknown): Promise<Expense>
  update(id: number, data: unknown): Promise<Expense>
  delete(id: number): Promise<void>
  search(filter?: ExpenseFilters): Promise<Expense[]>
  getById(id: number): Promise<Expense>
}
```

Service real:

```ts
export class ExpenseService implements IExpensesServies {
  async create(data: unknown): Promise<Expense> { ... }
  async update(id: number, data: unknown): Promise<Expense> { ... }
  async delete(id: number): Promise<void> { ... }
  async search(filters?: ExpenseFilters): Promise<Expense[]> { ... }
  async getById(id: number): Promise<Expense> { ... }
}

export const expenseService = new ExpenseService()
```

Repository real:

```ts
export class ExpenseRepository {
  async getAll(filters?: ExpenseFilters, client?: PoolClient): Promise<Expense[]> { ... }
  async getById(id: number, client?: PoolClient): Promise<Expense | null> { ... }
  async create(data: ExpenseDTO): Promise<Expense> { ... }
  async delete(id: number): Promise<boolean> { ... }
  async update(id: number, data: {...}, client?: PoolClient): Promise<Expense | null> { ... }
  async setClosed(close_id: number, expense_ids: number[], client?: PoolClient): Promise<boolean> { ... }
}

export const expenseRepository = new ExpenseRepository()
```

Controller real:

```ts
export const expenseController = {
  async search(req, res) { ... },
  async getById(req, res) { ... },
  async create(req, res) { ... },
  async update(req, res) { ... },
  async delete(req, res) { ... },
}
```

### C. sales

Interface real:

```ts
export interface ISaleService {
  create(data: unknown, details?: SaleDetailInput[], customer_id?: number): Promise<Sale>
  update(id: number, data: unknown, details?: SaleDetailInput[], customer_id?: number): Promise<Sale>
  delete(id: number): Promise<void>
  search(filters?: SaleFilters): Promise<Sale[]>
  getById(id: number): Promise<Sale>
  getDetails(id: number): Promise<unknown>
  getRemitoData(id: number): Promise<SaleRemitoData>
}
```

Service real:

```ts
export class SaleService implements ISaleService {
  async create(data: unknown, details?: SaleDetailInput[], customer_id?: number): Promise<Sale> { ... }
  async update(id: number, data: unknown, details?: SaleDetailInput[], customer_id?: number): Promise<Sale> { ... }
  async delete(id: number): Promise<void> { ... }
  async search(filters?: SaleFilters): Promise<Sale[]> { ... }
  async getById(id: number): Promise<Sale> { ... }
  async getDetails(id: number) { ... }
  async getRemitoData(id: number): Promise<SaleRemitoData> { ... }
}

export const saleService = new SaleService()
```

Conclusión sobre DI:
- No se usa DI por constructor ni un contenedor.
- Los repositorios son clases concretas, no interfaces.
- El patrón es manual y local: importar la clase concreta y usar la instancia exportada.

## 3) Modelos de dominio

### close.model.ts

```ts
import { CloseSchema, CloseData } from '@carniceria/shared'

export class Close implements CloseData {
  private readonly _id: number
  private readonly _start_at: Date
  private readonly _end_at: Date | null
  private readonly _total_income: number
  private readonly _total_expense: number
  private readonly _expected_cash: number | null

  constructor(data: unknown) {
    const validated = CloseSchema.parse(data)

    this._id = validated.id
    this._start_at = validated.start_at
    this._end_at = validated.end_at
    this._total_income = validated.total_income
    this._total_expense = validated.total_expense
    this._expected_cash = validated.expected_cash
  }

  get id(): number { return this._id }
  get start_at(): Date { return this._start_at }
  get end_at(): Date | null { return this._end_at }
  get total_income(): number { return this._total_income }
  get total_expense(): number { return this._total_expense }
  get isOpen(): boolean { return this._end_at === null }
  get expected_cash(): number | null { return this._expected_cash }
}
```

### finishClose.model.ts

```ts
import { FinishCloseSchema, FinishCloseData } from '@carniceria/shared'

export class FinishClose implements FinishCloseData {
  private readonly _end_at: Date
  private readonly _total_income: number
  private readonly _total_expense: number
  private readonly _expected_cash: number | null

  constructor(data: unknown) {
    const validated = FinishCloseSchema.parse(data)

    this._end_at = validated.end_at
    this._total_income = validated.total_income
    this._total_expense = validated.total_expense
    this._expected_cash = validated.expected_cash
  }

  get end_at(): Date { return this._end_at }
  get total_income(): number { return this._total_income }
  get total_expense(): number { return this._total_expense }
  get expected_cash(): number | null { return this._expected_cash }
}
```

### openClose.model.ts

```ts
import { CreateCloseSchema, CreateCloseData } from '@carniceria/shared'

export class OpenClose implements CreateCloseData {
  private readonly _start_at: Date

  constructor(data: unknown) {
    const validated = CreateCloseSchema.parse(data)
    this._start_at = validated.start_at
  }

  get start_at(): Date { return this._start_at }
}
```

### Qué son realmente estos modelos

- No son clases con lógica de negocio compleja.
- Son “value objects” o DTOs de dominio con validación por constructor.
- La validación se hace usando Zod a través de los schemas compartidos en packages/shared.
- Tienen getters, pero no métodos con comportamiento importante más allá de un getter simple como isOpen.

### Relación con DTOs de entrada/salida de API

Hay dos capas distintas:

1. DTOs de entrada/solicitud: clases como ExpenseDTO, UpdateExpenseDTO, SaleDTO, UpdateSaleDTO, CustomerDTO, UpdateCustomerDTO.
2. Modelos de dominio: clases como Expense, Sale, Customer, Close.

El flujo real es:
- el controller recibe body/params/query del request
- el route valida con Zod
- el controller pasa ese body al service
- el service crea un DTO (por ejemplo new ExpenseDTO(data))
- el repository usa el DTO para insertar/actualizar
- el repository convierte la fila de DB a un modelo con mapToModel(Model, row)

## 4) Validación

### Qué se usa

- Zod de forma dominante.
- No se usa class-validator.
- No se usa Joi ni otras bibliotecas de validación.

### Dónde vive la validación

1. En schemas compartidos de packages/shared/src/schemas:
   - closes.schema.ts
   - customer.schema.ts
   - sales.schema.ts
   - sale-details.schema.ts
   - expenses.schema.ts
   - debt.schema.ts

2. En schemas HTTP específicas en services/backend/src/http/schemas:
   - close.schema.ts
   - customer.schema.ts
   - sale.schema.ts
   - expense.schema.ts
   - debt.schema.ts
   - common.schema.ts

3. En middlewares de Express:
   - validate.middleware.ts

4. En modelos y DTOs por constructor:
   - los modelos y DTOs llaman a `.parse(data)` y convierten el input a una versión validada.

### Ejemplo real de validación en rutas

```ts
expenseRouter.post(
  '/',
  validateBody(CreateExpensesSchema),
  asyncHandler(expenseController.create)
)
```

### Validación especial del dominio

- SaleRequestSchema usa `superRefine` para exigir customer_id cuando pay_method === 'cc'.
- Los modelos de dominio ya no aceptan datos fuera del schema.

## 5) Prisma

### Resultado real

No hay Prisma en este repo.

No existe:
- schema.prisma
- PrismaClient
- prisma/ package
- configuración de cliente Prisma

### Qué se usa en su lugar

- PostgreSQL con pg Pool
- services/backend/src/db.ts expone un pool singleton
- los repositories usan `pool.query(...)` o un `PoolClient` opcional para transacciones

Archivo de conexión real:

```ts
import { Pool, types } from 'pg'
import { config } from './config'

types.setTypeParser(types.builtins.NUMERIC, (value) => Number(value))

export const pool = new Pool({ ... })
```

Instancia del pool:
- singleton global en db.ts
- no se crea una instancia por request
- no se inyecta por constructor

Ejemplo de repository con transacción:

```ts
export class CloseRepository {
  async finish(id: number, dto: FinishClose, client?: PoolClient): Promise<Close | null> {
    const executor = client ?? pool
    const { rows } = await executor.query(
      `UPDATE closes SET ... RETURNING *`,
      [dto.end_at, dto.total_income, dto.total_expense, dto.expected_cash, id]
    )
    return rows.length ? mapToModel(Close, rows[0]) : null
  }
}
```

### connection.test.ts

```ts
import { pool } from '../../db'

describe('Database connection', () => {
  it('should connect to the test database', async () => {
    const { rows } = await pool.query('SELECT current_database()')
    expect(rows[0].current_database).toBe('carniceria_test')
  })
})
```

## 6) Testing

### Comparación real: unit vs integration para la misma feature

#### Unit test: expense.service.test.ts

- Usa `vi.mock('../../features/expenses/expense.repository')`
- Usa `vi.mock('../../features/closes/close.repository')`
- Moca los repositorios para verificar la lógica de negocio del service
- No toca la base de datos
- Verifica que se lancen BusinessError / NotFoundError según el caso
- Ejemplo: `vi.spyOn(closeRepository, 'getActive').mockResolvedValue(mockClose)`

#### Integration test: expense.repository.test.ts

- Usa el repository real contra la base de datos real
- Crea datos de prueba con helpers en src/__tests__/helpers/createTestData.ts
- Verifica comportamiento SQL real: create/getAll/delete/update/setClosed
- No mockea los repositorios

### Lo que mockean los unit tests exactamente

Los unit tests no mockean Express ni HTTP; mockean los repositorios que el service usa.

En los unit tests se mockean principalmente:
- expenseRepository
- closeRepository
- y se crean modelos reales (no objetos planos) vía helpers de mocks

### mocks.ts

```ts
import { Customer } from '../../features/customers/models/customer.model'
import { CustomerDTO } from '../../features/customers/models/customer.dto'
import { Debt } from '../../features/debts/models/debt.model'
import { DebtDTO } from '../../features/debts/models/debt.dto'
import { DebtPaymentEvent } from '../../features/debts/models/debtPaymentEvent.model'
import { RecordDebtPayment } from '../../features/debts/models/recordDebtPayment.model'
import { Close } from '../../features/closes/models/close.model'
import { Sale } from '../../features/sales/models/sale.model'
import { SaleDetail } from '../../features/sale-details/models/sale-detail.model'
import { SaleDTO, UpdateSaleDTO } from '../../features/sales/models/sale.dto'
import { Expense } from '../../features/expenses/models/expense.model'
import { ExpenseDTO, UpdateExpenseDTO } from '../../features/expenses/models/expense.dto'

export const createMockCloseOpening = (overrides?: Partial<any>): Close => {
  return new Close({
    id: 1,
    start_at: new Date(),
    end_at: null,
    total_income: 0,
    total_expense: 0,
    expected_cash: null,
    ...overrides,
  })
}

export const createMockCloseFinished = (overrides?: Partial<any>): Close => {
  return new Close({
    id: 1,
    start_at: new Date(),
    end_at: new Date(),
    total_income: 1500,
    total_expense: 300,
    expected_cash: 1200,
    ...overrides,
  })
}

export const mockCloseOpening = createMockCloseOpening()
export const mockCloseFinished = createMockCloseFinished()

export const createMockSale = (overrides?: Partial<any>): Sale => {
  return new Sale({
    id: Math.floor(Math.random() * 1000) + 1,
    amount_meat: 0,
    amount_merchandise: 0,
    pay_method: 'cash',
    close_id: null,
    created_at: new Date(),
    ...overrides,
  })
}

export const createMockSaleDetail = (overrides?: Partial<any>): SaleDetail => {
  return new SaleDetail({
    id: Math.floor(Math.random() * 1000) + 1,
    sale_id: 1,
    cut_name: 'Asado',
    price_per_kg: 1000,
    weight_kg: 2,
    subtotal: 2000,
    created_at: new Date(),
    ...overrides,
  })
}

export const mockSaleDTO = new SaleDTO({
  amount_meat: 100,
  amount_merchandise: 50,
  pay_method: 'cash',
})

export const mockUpdateSaleDTO = new UpdateSaleDTO({
  amount_meat: 150,
  amount_merchandise: 75,
  pay_method: 'transfer',
})

export const createMockExpense = (overrides?: Partial<any>): Expense => {
  return new Expense({
    id: Math.floor(Math.random() * 1000) + 1,
    amount: 100,
    description: '',
    close_id: null,
    created_at: new Date(),
    category: 'other',
    ...overrides,
  })
}

export const createMockCustomer = (overrides?: Partial<any>): Customer => {
  return new Customer({
    id: 1,
    name: 'Juan',
    last_name: 'Perez',
    phone: '1234567890',
    created_at: new Date(),
    deleted_at: null,
    ...overrides,
  })
}

export const mockCustomer = createMockCustomer()

export const mockCustomerDTO = new CustomerDTO({
  name: 'Juan',
  last_name: 'Perez',
  phone: '1234567890',
  dni: '12345678',
})

export const createMockDebt = (overrides?: Partial<any>): Debt => {
  return new Debt({
    id: 1,
    customer_id: 1,
    sales_id: 1,
    amount: 1500,
    status: 'pending',
    pay_method: null,
    created_at: new Date(),
    updated_at: null,
    ...overrides,
  })
}

export const mockDebt = createMockDebt()

export const mockDebtDTO = new DebtDTO({
  sales_id: 1,
  customer_id: 1,
  amount: 1500,
})

export const createMockDebtForPayment = (overrides: Partial<{ id: number; amount: number; status: Debt['status'] }> = {}): { id: number; amount: number; status: Debt['status'] } => {
  return {
    id: 1,
    amount: 1500,
    status: 'pending',
    ...overrides,
  }
}

export const createMockRecordDebtPayment = (overrides?: Partial<any>): RecordDebtPayment => {
  return new RecordDebtPayment({
    paid_amount: 100,
    pay_method: 'cash',
    ...overrides,
  })
}

export const createMockDebtPaymentEvent = (overrides?: Partial<any>): DebtPaymentEvent => {
  return new DebtPaymentEvent({
    id: Math.floor(Math.random() * 1000) + 1,
    debt_id: 1,
    close_id: 1,
    paid_amount: 100,
    pay_method: 'cash',
    created_at: new Date(),
    ...overrides,
  })
}

export const mockExpenseDTO = new ExpenseDTO({
  category: 'other',
  amount: 100,
  description: 'Test expense',
})

export const mockUpdateExpenseDTO = new UpdateExpenseDTO({
  category: 'supplies',
  amount: 200,
  description: 'Updated expense',
})

export const mockExpense = createMockExpense()
```

### setup.ts

```ts
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })
console.log('Variables de entorno cargadas para tests (setupFiles)')

import { afterAll, beforeAll, beforeEach } from 'vitest'
import { pool } from '../db'
import { cleanDatabase } from './helpers/cleanDatabase'

beforeAll(async () => {
  try {
    await pool.query('SELECT 1')
    console.log('✓ Conectado a la DB de test')
  } catch (error) {
    console.error('✗ No se pudo conectar a la DB de test')
    process.exit(1)
  }
  await cleanDatabase()
})

beforeEach(async () => {
  await cleanDatabase()
})

const isSingleRun = process.argv.some(arg => arg === 'run')

afterAll(async () => {
  if (isSingleRun) await pool.end()
})
```

### globalSetup.ts

```ts
import * as dotenv from 'dotenv'

export default function globalSetup() {
  dotenv.config({ path: '.env.test' })
  console.log('Variables de entorno cargadas para tests (globalSetup)')
}
```

### Qué hace cada uno

- globalSetup.ts carga `.env.test` antes de iniciar la suite.
- setup.ts se ejecuta en el entorno de Vitest, valida que exista la DB de test y limpia la base antes de cada prueba.
- mocks.ts construye instancias reales de los modelos del dominio para usarlas en unit tests.

## 7) Manejo de errores

### Error centralizado

Hay una clase de error centralizada en services/backend/src/shared/errors.ts:

```ts
export class NotFoundError extends Error { ... }
export class ValidationError extends Error { ... }
export class BusinessError extends Error { ... }
export class UnauthorizedError extends Error { ... }
```

### Middleware de error handling

- services/backend/src/http/middlewares/error.middleware.ts
- convierte errores conocidos a respuestas JSON con `error.code`, `error.message`, `requestId` y, si aplica, `details`

### Mapas reales de errores

- ZodError -> 400 + code `VALIDATION_ERROR`
- ValidationError -> 400 + code `VALIDATION_ERROR`
- NotFoundError -> 404 + code `NOT_FOUND`
- UnauthorizedError -> 401 + code `UNAUTHORIZED`
- BusinessError -> 409 + code `BUSINESS_ERROR`
- errores de DB con códigos 23503 / 23505 -> 409 + code `BUSINESS_ERROR`
- cualquier otro error -> 500 + code `INTERNAL_SERVER_ERROR`

### Wrapper para async routes

- services/backend/src/http/utils/asyncHandler.ts
- captura errores de async/await y los reenvía al middleware de error

## 8) Convenciones de nombres, imports y barrel exports

### Convenciones de nombres

- Clases: PascalCase
  - CloseService, CloseRepository, CloseController (aunque el controller no es clase sino object literal)
  - ExpenseDTO, UpdateExpenseDTO
  - Customer, Sale, Debt, Expense
- Métodos: camelCase
  - create, search, getById, update, delete, recordPayment
- Campos de DB: snake_case
  - close_id, created_at, amount_meat, pay_method
- DTOs/inputs: prefijos/sufijos claros
  - DTO, UpdateDTO, Input, Filters

### Imports

- Los imports del proyecto se hacen principalmente con rutas relativas dentro del mismo módulo.
- Algunas capas importan el paquete compartido `@carniceria/shared` desde packages/shared.
- No hay imports de barrel dentro de features; las rutas son directas.

### Barrel exports

- No hay index.ts dentro de las features.
- El único barrel export visible es en packages/shared/src/index.ts:

```ts
export * from './schemas/customer.schema'
export * from './schemas/sales.schema'
export * from './schemas/sale-details.schema'
export * from './schemas/expenses.schema'
export * from './schemas/debt.schema'
export * from './schemas/closes.schema'
```

## 9) Qué es específico del dominio de carnicería y qué es genérico

### Patrones específicos del dominio de carnicería

Estos parecen muy ligados a ventas / deudas / gastos / cierres diarios:
- El concepto de close o cierre diario de caja.
- Las ventas pueden cerrarse y afectar la caja.
- El flujo de deuda por cuenta corriente (`cc`) crea una deuda asociada a la venta.
- Los gastos están ligados a un close activo.
- Existen reportes y PDFs de cierre/remito específicos a este negocio.
- Los nombres de métodos y entidades reflejan ese negocio: close, debt, remito, payment event.

### Patrones genéricos de arquitectura que aplicarían a otro proyecto

Estos sí son arquitectónicos y reutilizables:
- Separación en router/controller/service/repository.
- Validación con Zod en middleware de HTTP.
- Modelos de dominio con validación en constructor y getters.
- DTOs de entrada/actualización separados del modelo de dominio.
- Pattern de error centralizado y middleware de error global.
- Uso de un pool de DB singleton con transacciones opcionales por `PoolClient`.
- Serialización explícita para respuestas HTTP.
- Tests unitarios por lógica y tests de integración por persistencia real.

### Conclusión general

La arquitectura de este backend es relativamente simple y bastante explícita:
- HTTP -> route/validation -> controller -> service -> repository -> DB
- los modelos y DTOs hacen la validación de forma local y los schemas compartidos estabilizan el contrato
- no hay DI ni ORM, sino un patrón manual de clases concretas y un pool de PostgreSQL

Esta estructura es suficientemente genérica para aplicarla a otros dominios, aunque los nombres y algunas reglas de negocio (cierres, cuentas corrientes, pagos de deuda) son claramente específicos de carnicería.
