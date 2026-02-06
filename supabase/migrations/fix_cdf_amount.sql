-- Mise à jour des montants FC pour tout le monde à la valeur fixe : 156 710,51 FC
-- Si la colonne n'existe pas encore
ALTER TABLE solidaire_bank
ADD COLUMN IF NOT EXISTS montant_fc NUMERIC(20, 2);
-- Appliquer le montant fixe à TOUTES les entrées (Passées et Futures si non spécifié)
UPDATE solidaire_bank
SET montant_fc = 156710.51;
-- On peut aussi loguer ça
-- INSERT INTO receipt_logs ... (Optionnel)