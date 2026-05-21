CREATE TABLE IF NOT EXISTS debt_payment_events (
  id SERIAL PRIMARY KEY,
  debt_id INTEGER NOT NULL REFERENCES debts(id),
  close_id INTEGER NOT NULL REFERENCES closes(id),
  paid_amount NUMERIC(10,2) NOT NULL CHECK (paid_amount > 0),
  pay_method VARCHAR(20) NOT NULL CHECK (pay_method IN ('cash', 'credit', 'debit', 'transfer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debt_payment_events_debt_id ON debt_payment_events(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payment_events_close_id ON debt_payment_events(close_id);
