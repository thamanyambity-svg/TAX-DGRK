-- ==========================================
-- TABLE: QR ROUTER SEQUENCES
-- Système de redirection dynamique par QR code
-- Chaque token = une file d'attente d'URLs externes
-- ==========================================
CREATE TABLE IF NOT EXISTS qr_router_sequences (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    token TEXT NOT NULL,
    queue_order INT NOT NULL,
    external_url TEXT NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    scan_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(token, queue_order)
);

CREATE INDEX IF NOT EXISTS idx_qr_router_token ON qr_router_sequences(token);
CREATE INDEX IF NOT EXISTS idx_qr_router_unused ON qr_router_sequences(token, is_used) WHERE is_used = FALSE;

ALTER TABLE qr_router_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable ALL for all users on qr_router_sequences" ON qr_router_sequences
    FOR ALL
    USING (true)
    WITH CHECK (true);
