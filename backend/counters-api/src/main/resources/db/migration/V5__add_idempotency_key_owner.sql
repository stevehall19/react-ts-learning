DELETE FROM idempotency_key;

ALTER TABLE idempotency_key ADD COLUMN owner_id VARCHAR(255) NOT NULL;

ALTER TABLE idempotency_key
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (owner_id, idem_key);
