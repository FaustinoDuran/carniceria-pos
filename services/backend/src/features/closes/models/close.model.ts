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