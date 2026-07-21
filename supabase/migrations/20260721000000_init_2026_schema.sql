-- ==========================================
-- SCRIPT D'INITIALISATION SESSION 2026
-- ==========================================

-- 1. TABLE: DECLARATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS declarations (
    id TEXT PRIMARY KEY,
    "createdAt" TEXT,
    "updatedAt" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT,
    vehicle JSONB,
    tax JSONB,
    meta JSONB
);

ALTER TABLE declarations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable ALL for all users on declarations" ON declarations
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 2. TABLE: RECEIPT LOGS
-- ==========================================
CREATE TABLE IF NOT EXISTS receipt_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reference_number TEXT NOT NULL UNIQUE,
    qr_code_content TEXT NOT NULL UNIQUE,
    full_receipt_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_ip TEXT,
    agent_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_receipt_logs_qr ON receipt_logs(qr_code_content);

ALTER TABLE receipt_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable ALL for all users on receipt_logs" ON receipt_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 3. TABLE: PAYMENT PROOFS
-- ==========================================
CREATE TABLE IF NOT EXISTS payment_proofs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    declaration_id TEXT NOT NULL REFERENCES declarations(id) ON DELETE CASCADE,
    taxpayer_nif TEXT NOT NULL,
    taxpayer_name TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency TEXT DEFAULT 'FC',
    proof_type TEXT NOT NULL,
    transaction_ref TEXT,
    proof_file_url TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE,
    validated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_payment_proofs_decl ON payment_proofs(declaration_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_nif ON payment_proofs(taxpayer_nif);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_ref ON payment_proofs(transaction_ref);

ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable ALL for all users on payment_proofs" ON payment_proofs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. TABLE: SOLIDAIRE BANK
-- ==========================================
CREATE TABLE IF NOT EXISTS solidaire_bank (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    declaration_id TEXT NOT NULL REFERENCES declarations(id) ON DELETE CASCADE,
    numero_bordereau BIGINT NOT NULL UNIQUE,
    reference_rab TEXT NOT NULL UNIQUE,
    nom_deposant TEXT NOT NULL,
    montant_verse NUMERIC(15, 2) NOT NULL,
    devise TEXT DEFAULT 'USD',
    montant_en_lettres TEXT,
    date_heure_versement TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_valeur DATE DEFAULT CURRENT_DATE,
    agence TEXT DEFAULT '00010 AGENCE GOMBE',
    caisse TEXT DEFAULT '140 CAISSE SEC. GOMBE USD',
    guichetier TEXT DEFAULT 'VNGOMBA',
    compte_credit TEXT DEFAULT '33000061711-79',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solidaire_bordereau ON solidaire_bank(numero_bordereau);
CREATE INDEX IF NOT EXISTS idx_solidaire_rab ON solidaire_bank(reference_rab);
CREATE INDEX IF NOT EXISTS idx_solidaire_user ON solidaire_bank(nom_deposant);

ALTER TABLE solidaire_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable ALL for all users on solidaire_bank" ON solidaire_bank
    FOR ALL
    USING (true)
    WITH CHECK (true);
