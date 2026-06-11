import { ExpenseDTO, UpdateExpenseDTO } from './models/expense.dto'
import { Expense } from './models/expense.model'

export interface ExpenseFilters {
  category?: string
  close_id?: number | null
  date?: Date
}

export interface IExpensesServies { 
    create(data : ExpenseDTO): Promise<Expense>
    update(id: number, data : UpdateExpenseDTO) : Promise<Expense>
    delete(id: number): Promise<void>
    search(filter? : ExpenseFilters) : Promise<Expense[]>
    getById(id : number) : Promise<Expense>
}