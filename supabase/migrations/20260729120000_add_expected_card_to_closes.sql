-- Monto declarado del cierre de posnet (suma de credito + debito informada por la terminal).
-- Se carga igual que expected_cash: lo ingresa el cajero al cerrar la caja.
ALTER TABLE closes
  ADD COLUMN IF NOT EXISTS expected_card NUMERIC(10,2) DEFAULT NULL;
