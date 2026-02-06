-- Création de la table 'solidaire_bank' pour les preuves de paiement (Bordereaux)
-- Basé sur le modèle visuel fourni (Solidarité Banque)
CREATE TABLE IF NOT EXISTS solidaire_bank (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Lien technique vers la déclaration fiscale (DGRK/DGI)
    declaration_id TEXT NOT NULL REFERENCES declarations(id) ON DELETE CASCADE,
    -- 1. Numéro Bordereau : Unique et Séquentiel (ex: 30078)
    -- On utilisera une SEQUENCE ou la logique applicative pour incrémenter
    numero_bordereau BIGINT NOT NULL UNIQUE,
    -- 2. Référence RAB (dans le Motif) : ex: RAB25118948
    reference_rab TEXT NOT NULL UNIQUE,
    -- 3. Identité (Doit correspondre strictement au demandeur)
    nom_deposant TEXT NOT NULL,
    -- ex: KASIGWA NANKAFU MIRELLE
    -- Détails financiers
    montant_verse NUMERIC(15, 2) NOT NULL,
    -- ex: 69.00
    devise TEXT DEFAULT 'USD',
    montant_en_lettres TEXT,
    -- ex: "soixante neuf USD"
    -- 4. Dates Système
    date_heure_versement TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Haut de page (ex: 21 janv ... 13:53)
    date_valeur DATE DEFAULT CURRENT_DATE,
    -- Bas de page
    -- Champs Statiques / Configuration (pour reproduire le papier)
    agence TEXT DEFAULT '00010 AGENCE GOMBE',
    caisse TEXT DEFAULT '140 CAISSE SEC. GOMBE USD',
    guichetier TEXT DEFAULT 'VNGOMBA',
    -- Peut être rendu dynamique via l'utilisateur connecté
    compte_credit TEXT DEFAULT '33000061711-79',
    -- Métadonnées de sécurité
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_solidaire_bordereau ON solidaire_bank(numero_bordereau);
CREATE INDEX IF NOT EXISTS idx_solidaire_rab ON solidaire_bank(reference_rab);
CREATE INDEX IF NOT EXISTS idx_solidaire_user ON solidaire_bank(nom_deposant);
-- Sécurité (RLS)
ALTER TABLE solidaire_bank ENABLE ROW LEVEL SECURITY;
-- Politiques d'accès
-- Tout utilisateur authentifié (ou système) peut insérer un bordereau
CREATE POLICY "Enable insert for authenticated users" ON solidaire_bank FOR
INSERT WITH CHECK (
        auth.role() = 'authenticated'
        OR auth.role() = 'anon'
    );
-- Lecture autorisée pour vérification
CREATE POLICY "Enable read access for all users" ON solidaire_bank FOR
SELECT USING (true);