CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  dni VARCHAR(20),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE closes (
  id SERIAL PRIMARY KEY,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ DEFAULT NULL,
  total_income NUMERIC(10,2) DEFAULT 0,
  total_expense NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  close_id INTEGER REFERENCES closes(id) DEFAULT NULL,
  amount_meat NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_merchandise NUMERIC(10,2) NOT NULL DEFAULT 0,
  pay_method VARCHAR(20) NOT NULL CHECK (pay_method IN ('cash', 'credit', 'cc', 'debit', 'transfer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sale_details (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  cut_name VARCHAR(100) NOT NULL,
  price_per_kg NUMERIC(10,2) NOT NULL,
  weight_kg NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT sale_details_subtotal_check CHECK (subtotal = ROUND(price_per_kg * weight_kg, 2))
);

CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  close_id INTEGER REFERENCES closes(id) DEFAULT NULL,
  category VARCHAR(100) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE debts (
  id SERIAL PRIMARY KEY,
  sales_id INTEGER REFERENCES sales(id),
  customer_id INTEGER REFERENCES customers(id),
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);