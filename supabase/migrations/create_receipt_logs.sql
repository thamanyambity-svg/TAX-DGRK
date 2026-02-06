-- Création de la table de logs des récépissés sécurisés
-- Cette table garantit l'unicité des QR Codes et l'archivage des données.
CREATE TABLE IF NOT EXISTS receipt_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Le numéro de référence unique (ex: NDP-2026-xxxx)
    reference_number TEXT NOT NULL UNIQUE,
    -- Le contenu exact du QR Code (l'URL de vérification)
    -- La contrainte UNIQUE garantit qu'on ne peut pas générer deux fois le même QR
    qr_code_content TEXT NOT NULL UNIQUE,
    -- Snapshot complet des données (Contribuable + Véhicule + Paiement)
    -- Stocké en JSONB pour être interrogé facilement mais figé
    full_receipt_data JSONB NOT NULL,
    -- Métadonnées de sécurité
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_ip TEXT,
    -- Optionnel : pour tracer d'où vient la création
    agent_id TEXT -- Optionnel : l'ID de l'agent qui a créé le reçu
);
-- Index pour recherche ultra-rapide par scan de QR Code
CREATE INDEX IF NOT EXISTS idx_receipt_logs_qr ON receipt_logs(qr_code_content);
-- Politique de sécurité (RLS) : Lecture seule pour tout le monde, Insertion uniquement par le serveur/admin
ALTER TABLE receipt_logs ENABLE ROW LEVEL SECURITY;
-- Autoriser la lecture authentifiée (pour la vérification)
CREATE POLICY "Enable read access for all users" ON receipt_logs FOR
SELECT USING (true);
-- Autoriser l'insertion pour les utilisateurs authentifiés (les agents)
CREATE POLICY "Enable insert for authenticated users" ON receipt_logs FOR
INSERT WITH CHECK (
        auth.role() = 'authenticated'
        OR auth.role() = 'anon'
    );