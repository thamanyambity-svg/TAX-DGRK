-- Ajout de la colonne pour le montant en Francs Congolais (CDF)
-- et conversion automatique des entrées existantes sur une base de 69 USD = 193 200 FC (Taux 2800)
-- 1. Ajout de la colonne si elle n'existe pas
ALTER TABLE solidaire_bank
ADD COLUMN IF NOT EXISTS montant_fc NUMERIC(20, 2);
-- 2. Taux de change (Variable pour la session)
-- On considère le taux de 2800 FC pour 1 USD
UPDATE solidaire_bank
SET montant_fc = montant_verse * 2800
WHERE montant_fc IS NULL;
-- 3. Ajout d'une contrainte ou trigger pour l'avenir (Optionnel, géré par l'app)
-- L'application calculera désormais le montant_fc à l'insertion.