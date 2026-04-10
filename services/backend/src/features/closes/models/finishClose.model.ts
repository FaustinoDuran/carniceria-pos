import { FinishCloseSchema, FinishCloseData } from '@carniceria/shared'

export class FinishClose implements FinishCloseData {
    private readonly _end_at: string
    private readonly _total_income: number
    private readonly _total_expense: number

    constructor(data: unknown) {
        
        const validated = FinishCloseSchema.parse(data)

        this._end_at = validated.end_at
        this._total_income = validated.total_income
        this._total_expense = validated.total_expense
    }

    get end_at() : string { return this._end_at; }
    get total_income() : number { return this._total_income; }
    get total_expense() : number { return this._total_expense; }
}

