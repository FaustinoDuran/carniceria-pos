import { CreateExpensesSchema, CreateExpensesData, UpdateExpensesSchema, UpdateExpensesData } from '@carniceria/shared'

export class ExpenseDTO implements CreateExpensesData {
    private readonly _category: string;
    private readonly _amount: number;
    private readonly _description?: string;
    

    constructor(data: unknown) {
        
        const validated = CreateExpensesSchema.parse(data);

        this._category = validated.category;
        this._amount = validated.amount;
        this._description = validated.description;

    }

    get category(): string { return this._category; }
    get amount(): number { return this._amount; }
    get description(): string | undefined { return this._description; }
    

}

export class UpdateExpenseDTO implements UpdateExpensesData {
    private readonly _category?: string;
    private readonly _amount?: number;
    private readonly _description?: string;

    constructor(data: unknown) {
        const validated = UpdateExpensesSchema.parse(data);

        this._category = validated.category;
        this._amount = validated.amount;
        this._description = validated.description;
    }

    get category(): string | undefined { return this._category; }
    get amount(): number | undefined { return this._amount; }
    get description(): string | undefined { return this._description; }
}