CREATE TABLE idempotency_key (
                               idem_key      VARCHAR(64)  PRIMARY KEY,
                               request_hash  CHAR(64)     NOT NULL,
                               status_code   INT,
                               location      VARCHAR(255),
                               response_body TEXT,
                               created_at    TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) NOT NULL
);
