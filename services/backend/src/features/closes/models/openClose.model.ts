import { CreateCloseSchema, CreateCloseData } from '@carniceria/shared'

export class OpenClose implements CreateCloseData {
    private readonly _start_at: string

    constructor(data: unknown) {
        
        const validated = CreateCloseSchema.parse(data)

        this._start_at = validated.start_at
    }

    get start_at() : string { return this._start_at; }
}

