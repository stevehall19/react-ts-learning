ALTER TABLE counter ADD COLUMN owner_id VARCHAR(255);

UPDATE counter
SET owner_id = '4d67a23b-a34f-4a0c-9dec-97acde26dfd6'
WHERE owner_id IS NULL;

ALTER TABLE counter MODIFY COLUMN owner_id VARCHAR(255) NOT NULL;

CREATE INDEX idx_counter_owner_oldest
  ON counter (owner_id, created_at ASC);
