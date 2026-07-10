import  { mockCloseOpening, mockCloseFinished, createMockSale, createMockCloseFinished, createMockExpense, mockCloseReportData } from './mocks'
import { closeRepository } from '../../features/closes/close.repository'
import { saleRepository } from '../../features/sales/sale.repository'
import { expenseRepository } from '../../features/expenses/expense.repository'
import { debtRepository } from '../../features/debts/debt.repository'
import { closeService } from '../../features/closes/close.service'
import { BusinessError,NotFoundError } from '../../shared/errors';
import { withTransaction } from '../../shared/transaction.helper'

vi.mock('../../features/closes/close.repository')
vi.mock('../../features/sales/sale.repository')
vi.mock('../../features/expenses/expense.repository')
vi.mock('../../features/debts/debt.repository')
vi.mock('../../shared/transaction.helper', () => ({withTransaction: vi.fn() }))



describe('CloseService', () => {

	const mockClient = {} as any

	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(withTransaction).mockImplementation(async (callback) =>  callback(mockClient))
	})

	describe('start', () => {
		it('should start a new close', async () => {
			vi.spyOn(closeRepository, 'getActive').mockResolvedValue(null)
			vi.spyOn(closeRepository, 'create').mockResolvedValue(mockCloseOpening)

			const result = await closeService.start()
			expect(result).toEqual(mockCloseOpening)
			expect(closeRepository.getActive).toHaveBeenCalledTimes(1)
			expect(closeRepository.create).toHaveBeenCalledTimes(1)
		})
		it('should throw BusinessError if there is already an active close', async () => {
			vi.spyOn(closeRepository, 'getActive').mockResolvedValue(mockCloseOpening)
			
			await expect(closeService.start()).rejects.toBeInstanceOf(BusinessError)
			expect(closeRepository.getActive).toHaveBeenCalledTimes(1)
			expect(closeRepository.create).not.toHaveBeenCalled()
		})
	});

	describe('finish', () => {
		it('should return the finished close', async () => {
			vi.spyOn(closeRepository, 'getById').mockResolvedValue(mockCloseOpening)
			vi.spyOn(closeRepository, 'getActive').mockResolvedValue(mockCloseOpening)
			vi.spyOn(saleRepository, 'getAll').mockResolvedValue([createMockSale({ id: 10 })])
			vi.spyOn(expenseRepository, 'getAll').mockResolvedValue([])
			vi.spyOn(saleRepository, 'setClosed').mockResolvedValue(true)
			vi.spyOn(closeRepository, 'finish').mockResolvedValue(mockCloseFinished)

			const result = await closeService.finish(mockCloseOpening.id)
			expect(result).toEqual(mockCloseFinished)
			expect(closeRepository.getById).toHaveBeenCalledTimes(1)
			expect(closeRepository.getActive).toHaveBeenCalledTimes(1)
			expect(closeRepository.finish).toHaveBeenCalledTimes(1)
		})
		it('should return NotFoundError if not exist close with the given id',async () => {
			vi.spyOn(closeRepository, 'getById').mockResolvedValue(null)

			await expect(closeService.finish(999)).rejects.toBeInstanceOf(NotFoundError)
			expect(closeRepository.getById).toHaveBeenCalledTimes(1)
			expect(closeRepository.finish).not.toHaveBeenCalled()
		})
		it('should throw BusinessError if there is not an active close to finish', async () =>{
			vi.spyOn(closeRepository, 'getById').mockResolvedValue(mockCloseOpening)
			vi.spyOn(closeRepository, 'getActive').mockResolvedValue(null)

			await expect(closeService.finish(mockCloseOpening.id)).rejects.toBeInstanceOf(BusinessError)
			expect(closeRepository.getById).toHaveBeenCalledTimes(1)
			expect(closeRepository.getActive).toHaveBeenCalledTimes(1)
			expect(closeRepository.finish).not.toHaveBeenCalled()
		})
		it('should throw BusinessError if the close is already finished', async () => {
			vi.spyOn(closeRepository, 'getById').mockResolvedValue(mockCloseFinished)

			await expect(closeService.finish(mockCloseFinished.id)).rejects.toBeInstanceOf(BusinessError)
			expect(closeRepository.getById).toHaveBeenCalledTimes(1)
			expect(closeRepository.finish).not.toHaveBeenCalled()
		})

		it('should throw BusinessError if the close dont have sales and expenses registered', async () => {
			vi.spyOn(closeRepository, 'getById').mockResolvedValue(mockCloseOpening)
			vi.spyOn(closeRepository, 'getActive').mockResolvedValue(mockCloseOpening)
			vi.spyOn(saleRepository,'getAll').mockResolvedValue([])
			vi.spyOn(expenseRepository,'getAll').mockResolvedValue([])

			await expect(closeService.finish(mockCloseOpening.id)).rejects.toBeInstanceOf(BusinessError)
			
			expect(saleRepository.getAll).toHaveBeenCalledWith({ close_id: null }, mockClient)
			expect(expenseRepository.getAll).toHaveBeenCalledWith({ close_id: null }, mockClient)
			expect(closeRepository.finish).not.toHaveBeenCalled()
		})

		it('should calculate total_income as the sum of sales_amounts', async () => {
			vi.spyOn(closeRepository, 'getById').mockResolvedValue(mockCloseOpening)
			vi.spyOn(closeRepository, 'getActive').mockResolvedValue(mockCloseOpening)

			const sale1 = createMockSale({ amount_meat: 500, amount_merchandise: 200 })
			const sale2 = createMockSale({ amount_meat: 300, amount_merchandise: 100 })
			

			vi.spyOn(saleRepository,'getAll').mockResolvedValue([sale1, sale2])
			vi.spyOn(expenseRepository,'getAll').mockResolvedValue([])

			const close = createMockCloseFinished({ total_income: 1100 })

			vi.spyOn(closeRepository, 'finish').mockResolvedValue(close)

			await expect(closeService.finish(mockCloseOpening.id)).resolves.toEqual(close)
			expect(saleRepository.getAll).toHaveBeenCalledWith({ close_id: null }, mockClient)
			expect(expenseRepository.getAll).toHaveBeenCalledWith({ close_id: null }, mockClient)
			expect(closeRepository.finish).toHaveBeenCalledWith(mockCloseOpening.id, expect.objectContaining({ total_income: 1100 }), mockClient)
		})

		it('should calculate total_expense as the sum of expenses_amounts', async () => {
			vi.spyOn(closeRepository, 'getById').mockResolvedValue(mockCloseOpening)
			vi.spyOn(closeRepository, 'getActive').mockResolvedValue(mockCloseOpening)

			const expense1 = createMockExpense({ amount: 200 })
			const expense2 = createMockExpense({ amount: 100 })

			vi.spyOn(saleRepository,'getAll').mockResolvedValue([])
			vi.spyOn(expenseRepository,'getAll').mockResolvedValue([expense1, expense2])

			const close = createMockCloseFinished({ total_expense: 300 })

			vi.spyOn(closeRepository, 'finish').mockResolvedValue(close)

			await expect(closeService.finish(mockCloseOpening.id)).resolves.toEqual(close)
			expect(saleRepository.getAll).toHaveBeenCalledWith({ close_id: null }, mockClient)
			expect(expenseRepository.getAll).toHaveBeenCalledWith({ close_id: null }, mockClient)
			expect(closeRepository.finish).toHaveBeenCalledWith(mockCloseOpening.id, expect.objectContaining({ total_expense: 300 }), mockClient)
		})

		it('should set close.id in the sales when finish a close', async () =>{
			vi.spyOn(closeRepository, 'getById').mockResolvedValue(mockCloseOpening)
			vi.spyOn(closeRepository, 'getActive').mockResolvedValue(mockCloseOpening)
			
			const sale1 = createMockSale({ id: 12, amount_meat: 500, amount_merchandise: 200 })
			const sale2 = createMockSale({ id: 34, amount_meat: 300, amount_merchandise: 100 })

			vi.spyOn(saleRepository,'getAll').mockResolvedValue([sale1, sale2])
			vi.spyOn(expenseRepository,'getAll').mockResolvedValue([])
			vi.spyOn(closeRepository, 'finish').mockResolvedValue(mockCloseFinished)
			vi.spyOn(saleRepository, 'setClosed').mockResolvedValue(true)

			await closeService.finish(mockCloseOpening.id)

			expect(saleRepository.setClosed).toHaveBeenCalledWith(mockCloseOpening.id, [12, 34], mockClient)
		})

		it('should set close.id in the expenses when finish a close', async () =>{
			vi.spyOn(closeRepository, 'getById').mockResolvedValue(mockCloseOpening)
			vi.spyOn(closeRepository, 'getActive').mockResolvedValue(mockCloseOpening)
			
			const expense1 = createMockExpense({ id: 56, amount: 200 })
			const expense2 = createMockExpense({ id: 78, amount: 100 })

			vi.spyOn(saleRepository,'getAll').mockResolvedValue([])
			vi.spyOn(expenseRepository,'getAll').mockResolvedValue([expense1, expense2])
			vi.spyOn(closeRepository, 'finish').mockResolvedValue(mockCloseFinished)
			vi.spyOn(expenseRepository, 'setClosed').mockResolvedValue(true)

			await closeService.finish(mockCloseOpening.id)

			expect(expenseRepository.setClosed).toHaveBeenCalledWith(mockCloseOpening.id, [56, 78], mockClient)
		})

		it('should execute finish flow inside withTransaction and pass mockClient to repositories',async () => {
			
			vi.spyOn(closeRepository, 'getById').mockResolvedValue(mockCloseOpening)
			vi.spyOn(closeRepository, 'getActive').mockResolvedValue(mockCloseOpening)

			const sale1 = createMockSale({ id: 12, amount_meat: 500, amount_merchandise: 200 })
			const expense1 = createMockExpense({ id: 56, amount: 200 })

			vi.spyOn(saleRepository, 'getAll').mockResolvedValue([sale1])
			vi.spyOn(expenseRepository, 'getAll').mockResolvedValue([expense1])
			vi.spyOn(closeRepository, 'finish').mockResolvedValue(mockCloseFinished)
			vi.spyOn(saleRepository, 'setClosed').mockResolvedValue(true)
			vi.spyOn(expenseRepository, 'setClosed').mockResolvedValue(true)			

			await closeService.finish(mockCloseOpening.id)

			expect(withTransaction).toHaveBeenCalledTimes(1)
			expect(closeRepository.getById).toHaveBeenCalledWith(mockCloseOpening.id, mockClient)
			expect(saleRepository.getAll).toHaveBeenCalledWith({ close_id: null }, mockClient)
			expect(expenseRepository.getAll).toHaveBeenCalledWith({ close_id: null }, mockClient)
			expect(closeRepository.finish).toHaveBeenCalledWith(mockCloseOpening.id, expect.any(Object), mockClient)
			expect(saleRepository.setClosed).toHaveBeenCalledWith(mockCloseOpening.id, [12], mockClient)
			expect(expenseRepository.setClosed).toHaveBeenCalledWith(mockCloseOpening.id, [56], mockClient)
		})

		it('should forward expected_cash from input to closeRepository.finish', async () => {
			

			vi.spyOn(closeRepository, 'getById').mockResolvedValue(mockCloseOpening)
			vi.spyOn(closeRepository, 'getActive').mockResolvedValue(mockCloseOpening)
			vi.spyOn(saleRepository, 'getAll').mockResolvedValue([createMockSale({ id: 101 })])
			vi.spyOn(expenseRepository, 'getAll').mockResolvedValue([])
			vi.spyOn(closeRepository, 'finish').mockResolvedValue(mockCloseFinished)
			vi.spyOn(saleRepository, 'setClosed').mockResolvedValue(true)

			await closeService.finish(mockCloseOpening.id, { expected_cash: 500 })

			expect(closeRepository.finish).toHaveBeenCalledWith(
				mockCloseOpening.id,
				expect.objectContaining({ expected_cash: 500 }),
				mockClient,
			)
		})
	})
	describe('getById', () => {
		it('should return the close with the given id if exist', async () => {
			vi.spyOn(closeRepository, 'getById').mockResolvedValue(mockCloseFinished)

			const result = await closeService.getById(mockCloseFinished.id)
			expect(result).toEqual(mockCloseFinished)
			expect(closeRepository.getById).toHaveBeenCalledWith(mockCloseFinished.id)
		})

		it('should return NotFoundError if not exist close with the given id', async () => {
			vi.spyOn(closeRepository, 'getById').mockResolvedValue(null)

			await expect(closeService.getById(999)).rejects.toBeInstanceOf(NotFoundError)
			expect(closeRepository.getById).toHaveBeenCalledWith(999)
		})
	})

	describe('getActive', () => {
		it('should return the active close if exist', async () => {
			vi.spyOn(closeRepository, 'getActive').mockResolvedValue(mockCloseOpening)

			const result = await closeService.getActive()
			expect(result).toEqual(mockCloseOpening)
			expect(closeRepository.getActive).toHaveBeenCalledWith()
		})
		
		it('should return null if there is no active close', async () => {
			vi.spyOn(closeRepository, 'getActive').mockResolvedValue(null)	

			const result = await closeService.getActive()
			expect(result).toBeNull()
			expect(closeRepository.getActive).toHaveBeenCalledWith()
		})
	})

	describe('search', () => {
		it('should return an array of closes without filters', async () => {
			const closes = [mockCloseOpening, mockCloseFinished]
			vi.spyOn(closeRepository, 'getAll').mockResolvedValue(closes)

			const result = await closeService.search()
			expect(result).toEqual(closes)
			expect(closeRepository.getAll).toHaveBeenCalledWith(undefined)
		})

		it('should return an array of closes filtered by start_at', async () => {
			const closes = [mockCloseOpening]
			vi.spyOn(closeRepository, 'getAll').mockResolvedValue(closes)

			const result = await closeService.search({ start_at: mockCloseOpening.start_at })
			expect(result).toEqual(closes)
			expect(closeRepository.getAll).toHaveBeenCalledWith({ start_at: mockCloseOpening.start_at })
		})
		
		it('should return an array of closes filtered by end_at', async () => {
			const closes = [mockCloseFinished]
			vi.spyOn(closeRepository, 'getAll').mockResolvedValue(closes)

			const result = await closeService.search({ end_at: mockCloseFinished.end_at })
			expect(result).toEqual(closes)
			expect(closeRepository.getAll).toHaveBeenCalledWith({ end_at: mockCloseFinished.end_at })
		})

		it('should return an empty array when no closes match the given filters', async () => {
			vi.spyOn(closeRepository, 'getAll').mockResolvedValue([])

			const result = await closeService.search({ start_at: new Date('2023-01-01') })
			expect(result).toEqual([])
			expect(closeRepository.getAll).toHaveBeenCalledWith({ start_at: new Date('2023-01-01') })

		})
	})

	describe('getReportData', () => {
		it('should return notFoundError if not exist close with the given id', async () => {
			vi.spyOn(closeRepository, 'getById').mockResolvedValue(null)

			await expect(closeService.getReportData(999)).rejects.toBeInstanceOf(NotFoundError)
			expect(closeRepository.getById).toHaveBeenCalledWith(999)
		})

		it('should return businessError if the close with the given id is not finished', async () => {
			vi.spyOn(closeRepository, 'getById').mockResolvedValue(mockCloseOpening)

			await expect(closeService.getReportData(mockCloseOpening.id)).rejects.toBeInstanceOf(BusinessError)
			expect(closeRepository.getById).toHaveBeenCalledWith(mockCloseOpening.id)
		})

		it('should return the report with all sections data', async () => {
			const close = mockCloseReportData.close
			const sales = mockCloseReportData.sales.all
			const expenses = mockCloseReportData.expenses
			const generatedDebts = mockCloseReportData.debts.generated
			const paidDebts = mockCloseReportData.debts.paid

			vi.spyOn(closeRepository, 'getById').mockResolvedValue(close)
			vi.spyOn(saleRepository, 'getAll').mockResolvedValue(sales)
			vi.spyOn(expenseRepository, 'getAll').mockResolvedValue(expenses)
			vi.spyOn(debtRepository, 'getGeneratedForCloseReport').mockResolvedValue(generatedDebts)
			vi.spyOn(debtRepository, 'getPaidForCloseReport').mockResolvedValue(paidDebts)

			const result = await closeService.getReportData(close.id)
			expect(result).toEqual(mockCloseReportData)
			expect(closeRepository.getById).toHaveBeenCalledWith(close.id)
			expect(saleRepository.getAll).toHaveBeenCalledWith({ close_id: close.id })
			expect(expenseRepository.getAll).toHaveBeenCalledWith({ close_id: close.id })
			expect(debtRepository.getGeneratedForCloseReport).toHaveBeenCalledWith(close.id)
			expect(debtRepository.getPaidForCloseReport).toHaveBeenCalledWith(close.id)
		})
	})
})
