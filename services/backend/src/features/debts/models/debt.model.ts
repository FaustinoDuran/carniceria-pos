import { DebtCreateSchema,  DebtCreateData } from '@carniceria/shared'

export class Debt implements DebtCreateData {
    private readonly _sales_id : string
    private readonly _customer_id : string
    private readonly _amount : number 

    constructor(data: unknown) {

        const validated = DebtCreateSchema.parse(data) 

        this._sales_id = validated.sales_id
        this._customer_id = validated.customer_id
        this._amount = validated.amount
    }

    get sales_id() : string { return this._sales_id; }
    get customer_id() : string { return this._customer_id; }
    get amount() : number { return this._amount; }
}

