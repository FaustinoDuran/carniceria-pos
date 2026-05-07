import { CreateSaleDetailData, CreateSaleDetailSchema } from '@carniceria/shared'

export class SaleDetailDTO implements CreateSaleDetailData {
    private readonly _cut_name: CreateSaleDetailData['cut_name']
    private readonly _price_per_kg: CreateSaleDetailData['price_per_kg']
    private readonly _weight_kg: CreateSaleDetailData['weight_kg']
    private readonly _subtotal: number

    constructor(data: unknown) {
        const validated = CreateSaleDetailSchema.parse(data)

        this._cut_name = validated.cut_name
        this._price_per_kg = validated.price_per_kg
        this._weight_kg = validated.weight_kg
        this._subtotal = Number((validated.price_per_kg * validated.weight_kg).toFixed(2))
    }

    get cut_name(): CreateSaleDetailData['cut_name'] { return this._cut_name }
    get price_per_kg(): CreateSaleDetailData['price_per_kg'] { return this._price_per_kg }
    get weight_kg(): CreateSaleDetailData['weight_kg'] { return this._weight_kg }
    get subtotal(): number { return this._subtotal }
}
