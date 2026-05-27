DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'closes_end_after_start'
      AND conrelid = 'closes'::regclass
  ) THEN
    ALTER TABLE closes
      ADD CONSTRAINT closes_end_after_start
      CHECK (end_at IS NULL OR end_at >= start_at);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_closes_single_open
  ON closes ((1))
  WHERE end_at IS NULL;
