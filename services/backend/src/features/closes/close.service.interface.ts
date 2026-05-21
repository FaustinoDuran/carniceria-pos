import type {CloseReportData} from './types'
import { Close } from './models/close.model'


export interface CloseFilters {
  start_at?: Date
  end_at?: Date | null
  is_open?: boolean
}

export interface FinishCloseInput {
  expected_cash?: number | null
}

export interface ICloseService {
    start() : Promise< Close >;
    finish( id: number, input?: FinishCloseInput ): Promise<Close>;
    getAll( filters?: CloseFilters ): Promise< Close[] >;
    getById( id: number ): Promise< Close >;
    getActive(): Promise< Close >;
    getReportData(id : number): Promise<CloseReportData>;
}