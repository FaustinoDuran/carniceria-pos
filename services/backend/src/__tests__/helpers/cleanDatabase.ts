import { pool } from '../../db'

export async function cleanDatabase() {
  await pool.query('DELETE FROM debt_payment_events')
  await pool.query('DELETE FROM debts')
  await pool.query('DELETE FROM sales')
  await pool.query('DELETE FROM expenses')
  await pool.query('DELETE FROM closes')
  await pool.query('DELETE FROM customers')
}