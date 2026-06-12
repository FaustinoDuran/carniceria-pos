import type { CreateSaleDetailData } from '@carniceria/shared'
import { PoolClient } from 'pg'
import { saleRepository } from './sale.repository'
import { saleDetailRepository } from '../sale-details/sale-detail.repository'
import { debtService } from '../debts/debt.service'
import { debtRepository } from '../debts/debt.repository'
import { closeService } from '../closes/close.service'
import { DebtDTO } from '../debts/models/debt.dto'
import { Sale } from './models/sale.model'
import { SaleDTO, UpdateSaleDTO } from './models/sale.dto'
import { SaleDetailDTO } from '../sale-details/models/sale-detail.dto'
import { withTransaction } from '../../shared/transaction.helper'
import { BusinessError, NotFoundError } from '../../shared/errors'
import { SaleFilters } from './types'
import { ISaleService, SaleDetailInput, SaleRemitoData } from './sale.service.interface'

export class SaleService implements ISaleService {
    private calculateMeatAmount(details: SaleDetailDTO[]): number {
        return details.reduce((total, detail) => total + detail.subtotal, 0)
    }

    private async createDebtIfRequired(
        client: PoolClient,
        sale: Sale,
        pay_method: Sale['pay_method'],
        customer_id: number | undefined,
        amount: number,
    ): Promise<void> {
        if (pay_method !== 'cc') {
            return
        }

        if (!customer_id) {
            throw new BusinessError('Customer ID is required for cc sale')
        }

        const debtDto = new DebtDTO({
            sales_id: sale.id,
            customer_id,
            amount,
        })

        await debtService.create(debtDto, client)
    }

    async create(data: unknown, details?: SaleDetailInput[], customer_id?: number): Promise<Sale> {
        const dto = new SaleDTO(data)
        const detailDtos = (details ?? []).map((detail) => new SaleDetailDTO(detail))
        const amount_meat = detailDtos.length ? this.calculateMeatAmount(detailDtos) : dto.amount_meat
        const amount_merchandise = dto.amount_merchandise
        const totalAmount = Number((amount_meat + amount_merchandise).toFixed(2))

        if (dto.pay_method === 'cc' && !customer_id) {
            throw new BusinessError('Customer ID is required for cc sale')
        }

        // Lazy open: check if active close exists, if not create one
        const activeClose = await closeService.getActive()
        if (!activeClose) {
            await closeService.start()
        }

        return withTransaction(async (client) => {
            const saleDto = new SaleDTO({
                amount_meat,
                amount_merchandise,
                pay_method: dto.pay_method,
            })
            const sale = await saleRepository.create(saleDto, client)

            if (detailDtos.length) {
                await saleDetailRepository.createMany(sale.id, detailDtos, client)
            }

            await this.createDebtIfRequired(client, sale, dto.pay_method, customer_id, totalAmount)

            return sale
        })
    }

    async update(
        id: number,
        data: unknown,
        details?: SaleDetailInput[],
        customer_id?: number,
    ): Promise<Sale> {
        const sale = await saleRepository.getById(id)

        if (!sale) {
            throw new NotFoundError('Sale not found')
        }

        if (sale.close_id !== null) {
            throw new BusinessError('Cannot update a closed sale')
        }

        const hasDebt = await debtRepository.hasBySaleId(id)
        if (hasDebt) {
            throw new BusinessError('Cannot update a sale with current account debt')
        }

        const dto = new UpdateSaleDTO(data)
        const detailDtos = (details ?? []).map((detail) => new SaleDetailDTO(detail))
        const updateData: {
            amount_meat?: number
            amount_merchandise?: number
            pay_method?: string
        } = {}

        if (detailDtos.length) {
            updateData.amount_meat = this.calculateMeatAmount(detailDtos)
        } else if (dto.amount_meat !== undefined) {
            updateData.amount_meat = dto.amount_meat
        }

        if (dto.amount_merchandise !== undefined) {
            updateData.amount_merchandise = dto.amount_merchandise
        }

        if (dto.pay_method !== undefined) {
            updateData.pay_method = dto.pay_method
        }

        const nextPayMethod = updateData.pay_method ?? sale.pay_method
        const totalAmount = Number(
            ((updateData.amount_meat ?? sale.amount_meat) + (updateData.amount_merchandise ?? sale.amount_merchandise)).toFixed(2),
        )

        if (nextPayMethod === 'cc' && !customer_id && sale.pay_method !== 'cc') {
            throw new BusinessError('Customer ID is required for cc sale')
        }

        return withTransaction(async (client) => {
            const updatedSale = Object.keys(updateData).length
                ? await saleRepository.update(id, updateData, client)
                : sale

            if (!updatedSale) {
                throw new NotFoundError('Sale could not be updated')
            }

            if (details !== undefined) {
                await saleDetailRepository.deleteBySaleId(id, client)
                if (detailDtos.length) {
                    await saleDetailRepository.createMany(id, detailDtos, client)
                }
            }

            if (sale.pay_method !== 'cc' && nextPayMethod === 'cc') {
                await this.createDebtIfRequired(client, updatedSale, nextPayMethod, customer_id, totalAmount)
            }

            return updatedSale
        })
    }

    async delete(id: number): Promise<void> {
        await withTransaction(async (client) => {
            const sale = await saleRepository.getById(id, client)

            if (!sale) {
                throw new NotFoundError('Sale not found')
            }

            if (sale.close_id !== null) {
                throw new BusinessError('Cannot delete a closed sale')
            }

            const debt = await debtRepository.getBySaleIdForUpdate(id, client)
            if (debt) {
                const paymentEvents = await debtRepository.getPaymentEvents({ debt_id: debt.id }, client)
                if (paymentEvents.length > 0) {
                    throw new BusinessError('Cannot delete a sale with recorded debt payments')
                }

                await debtRepository.delete(debt.id, client)
            }

            const deleted = await saleRepository.delete(id, client)
            if (!deleted) {
                throw new BusinessError('Sale could not be deleted')
            }
        })
    }

    async search(filters?: SaleFilters): Promise<Sale[]> {
        return saleRepository.getAll(filters)
    }

    async getById(id: number): Promise<Sale> {
        const sale = await saleRepository.getById(id)
        if (!sale) {
            throw new NotFoundError('Sale not found')
        }
        return sale
    }

    async getDetails(id: number) {
        const sale = await saleRepository.getById(id)
        if (!sale) {
            throw new NotFoundError('Sale not found')
        }

        return saleDetailRepository.getBySaleId(id)
    }

    async getRemitoData(id: number): Promise<SaleRemitoData> {
        const sale = await saleRepository.getById(id)
        if (!sale) {
            throw new NotFoundError('Sale not found')
        }

        const details = await saleDetailRepository.getBySaleId(id)
        if (!details.length) {
            throw new BusinessError('El remito solo se puede imprimir para ventas con detalle de cortes')
        }

        const customer = await debtRepository.getCustomerBySaleId(id)

        return {
            sale,
            details,
            customer,
        }
    }
}

export const saleService = new SaleService()
