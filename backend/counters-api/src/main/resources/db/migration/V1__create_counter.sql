CREATE TABLE counter (
                       id UUID PRIMARY KEY,
                       label VARCHAR(100) NOT NULL,
                       step INT NOT NULL CHECK (step > 0),
                       start INT NOT NULL,
                       count INT NOT NULL,
                       created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
