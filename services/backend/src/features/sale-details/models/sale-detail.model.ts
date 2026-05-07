import { SaleDetailData, SaleDetailSchema } from '@carniceria/shared'

export class SaleDetail implements SaleDetailData {
    private readonly _id: SaleDetailData['id']
    private readonly _sale_id: SaleDetailData['sale_id']
    private readonly _cut_name: SaleDetailData['cut_name']
    private readonly _price_per_kg: SaleDetailData['price_per_kg']
    private readonly _weight_kg: SaleDetailData['weight_kg']
    private readonly _subtotal: SaleDetailData['subtotal']
    private readonly _created_at: SaleDetailData['created_at']

    constructor(data: unknown) {
        const validated = SaleDetailSchema.parse(data)

        this._id = validated.id
        this._sale_id = validated.sale_id
        this._cut_name = validated.cut_name
        this._price_per_kg = validated.price_per_kg
        this._weight_kg = validated.weight_kg
        this._subtotal = validated.subtotal
        this._created_at = validated.created_at
    }

    get id(): SaleDetailData['id'] { return this._id }
    get sale_id(): SaleDetailData['sale_id'] { return this._sale_id }
    get cut_name(): SaleDetailData['cut_name'] { return this._cut_name }
    get price_per_kg(): SaleDetailData['price_per_kg'] { return this._price_per_kg }
    get weight_kg(): SaleDetailData['weight_kg'] { return this._weight_kg }
    get subtotal(): SaleDetailData['subtotal'] { return this._subtotal }
    get created_at(): SaleDetailData['created_at'] { return this._created_at }
}
