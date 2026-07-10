import type {CloseReportData} from './types'
import { Close } from './models/close.model'


export interface CloseFilters {
  start_at?: Date
  end_at?: Date | null
  month?: string
  limit?: number
  offset?: number
}

export interface FinishCloseInput {
  expected_cash?: number | null
}

export interface ICloseService {
    start() : Promise< Close >;
    finish( id: number, input?: FinishCloseInput ): Promise<Close>;
    search( filters?: CloseFilters ): Promise< Close[] >;
    getById( id: number ): Promise< Close >;
    getActive(): Promise< Close | null>;
    getReportData(id : number): Promise<CloseReportData>;
}