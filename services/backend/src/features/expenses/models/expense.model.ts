import { ExpensesSchema, ExpensesData } from '@carniceria/shared'

export class Expense implements ExpensesData {
    private readonly _id: number;
    private readonly _category: string;
    private readonly _amount: number;
    private readonly _description?: string | undefined ;
    private readonly _close_id: number | null;
    private readonly _created_at: Date;
    

    constructor(data: unknown) {
        
        const validated = ExpensesSchema.parse(data);

        this._id = validated.id
        this._category = validated.category;
        this._amount = validated.amount;
        this._description = validated.description;
        this._close_id = validated.close_id
        this._created_at = validated.created_at

    }

    get id(): number {return this._id}
    get category(): string { return this._category; }
    get amount(): number { return this._amount; }
    get description(): string | undefined { return this._description; }
    get close_id(): number | null { return this._close_id; }
    get created_at(): Date { return this._created_at}
     
}



