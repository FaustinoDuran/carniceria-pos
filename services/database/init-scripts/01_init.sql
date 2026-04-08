CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  dni VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  amount_meat NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_merchandise NUMERIC(10,2) NOT NULL DEFAULT 0,
  pay_method VARCHAR(20) NOT NULL CHECK (pay_method IN ('cash', 'card', 'cc')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE debt (
  id SERIAL PRIMARY KEY,
  sales_id INTEGER REFERENCES sales(id),
  customer_id INTEGER REFERENCES customers(id),
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE closes (
  id SERIAL PRIMARY KEY,
  start_at TIMESTAMP NOT NULL,
  end_at TIMESTAMP,
  total_income NUMERIC(10,2) DEFAULT 0,
  total_expense NUMERIC(10,2) DEFAULT 0
);