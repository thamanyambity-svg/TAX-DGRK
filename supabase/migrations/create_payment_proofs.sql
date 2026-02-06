-- Création de la table des Preuves de Paiement (Payment Proofs)
-- Cette table stocke les traces financières associées à chaque déclaration/contribuable.
CREATE TABLE IF NOT EXISTS payment_proofs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Lien vers la déclaration (Récépissé)
    -- On utilise TEXT car vos IDs sont formatés (DECL-2026-...)
    declaration_id TEXT NOT NULL REFERENCES declarations(id) ON DELETE CASCADE,
    -- Lien vers la personne (Contribuable)
    taxpayer_nif TEXT NOT NULL,
    taxpayer_name TEXT NOT NULL,
    -- Copie du nom pour recherche rapide
    -- Détails financiers
    amount NUMERIC(15, 2) NOT NULL,
    currency TEXT DEFAULT 'FC',
    -- 'FC' ou 'USD'
    -- La Preuve elle-même
    proof_type TEXT NOT NULL,
    -- 'BORDEREAU_BANQUE', 'MOBILE_MONEY', 'ESPECE'
    transaction_ref TEXT,
    -- Numéro du bordereau ou Référence transaction
    proof_file_url TEXT,
    -- URL si une photo du bordereau est uploadée (optionnel)
    -- Statut du paiement
    status TEXT DEFAULT 'PENDING',
    -- 'PENDING' (En attente), 'VALIDATED' (Validé), 'REJECTED' (Refusé)
    -- Traçabilité
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE,
    validated_by TEXT -- ID de l'agent qui a validé
);
-- Index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_payment_proofs_decl ON payment_proofs(declaration_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_nif ON payment_proofs(taxpayer_nif);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_ref ON payment_proofs(transaction_ref);
-- Sécurité (RLS)
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
-- Tout le monde peut lire (pour vérification) ou restreindre aux agents connectés
CREATE POLICY "Enable read access for authenticated users" ON payment_proofs FOR
SELECT USING (
        auth.role() = 'authenticated'
        OR auth.role() = 'anon'
    );
-- Insertion autorisée
CREATE POLICY "Enable insert for authenticated users" ON payment_proofs FOR
INSERT WITH CHECK (
        auth.role() = 'authenticated'
        OR auth.role() = 'anon'
    );
-- Mise à jour (Validation) autorisée
CREATE POLICY "Enable update for authenticated users" ON payment_proofs FOR
UPDATE USING (
        auth.role() = 'authenticated'
        OR auth.role() = 'anon'
    );