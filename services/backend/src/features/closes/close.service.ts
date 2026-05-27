import { CloseFilters, FinishCloseInput, ICloseService } from './close.service.interface';
import { Close } from './models/close.model';
import { CloseReportData } from './types';

export class CloseService implements ICloseService {
    async start(): Promise<Close> {
        // Implementation for starting a new close
        throw new Error('Method not implemented.');
    }

    async finish(id: number, input?: FinishCloseInput): Promise<Close> {
        // Implementation for finishing a close
        throw new Error('Method not implemented.');
    }

    async getAll(filters?: CloseFilters): Promise<Close[]> {
        // Implementation for retrieving all closes with optional filters
        throw new Error('Method not implemented.');
    }

    async getById(id: number): Promise<Close> {
        // Implementation for retrieving a close by its ID
        throw new Error('Method not implemented.');
    }

    async getActive(): Promise<Close> {
        // Implementation for retrieving the active close
        throw new Error('Method not implemented.');
    }

    async getReportData(id: number): Promise<CloseReportData> {
        // Implementation for retrieving report data for a specific close
        throw new Error('Method not implemented.');
    }
}

export const closeService = new CloseService();