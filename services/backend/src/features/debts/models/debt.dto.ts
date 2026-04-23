import { CreateDebtSchema,  CreateDebtData } from '@carniceria/shared'

export class DebtDTO implements CreateDebtData {
    private readonly _sales_id : number
    private readonly _customer_id : number
    private readonly _amount : number 

    constructor(data: unknown) {

        const validated = CreateDebtSchema.parse(data) 

        this._sales_id = validated.sales_id
        this._customer_id = validated.customer_id
        this._amount = validated.amount
    }

    get sales_id() : number { return this._sales_id; }
    get customer_id() : number { return this._customer_id; }
    get amount() : number { return this._amount; }
}
