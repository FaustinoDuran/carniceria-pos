import { Expense } from './models/expense.model'

export interface ExpenseFilters {
  category?: string
  close_id?: number | null
  date?: Date
}

export interface IExpensesServies { 
    create(data : unknown): Promise<Expense>
    update(id: number, data : unknown) : Promise<Expense>
    delete(id: number): Promise<void>
    search(filter? : ExpenseFilters) : Promise<Expense[]>
    getById(id : number) : Promise<Expense>
}
