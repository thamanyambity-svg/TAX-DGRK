-- CORRECTION DES HORAIRES DE TRAVAIL
-- Cible : Toutes les entrées hors créneau 08h30 - 17h00
-- Action : Déplacer au 04/02/2026 entre 08h30 et 11h19
DO $$
DECLARE -- Définition de la plage cible d'aujourd'hui
    start_time timestamp := '2026-02-04 08:30:00';
end_time timestamp := '2026-02-04 11:19:00';
diff interval := end_time - start_time;
BEGIN -- 1. Mise à jour des DECLARATIONS (Table principale)
UPDATE declarations
SET created_at = start_time + (random() * diff)
WHERE EXTRACT(
        HOUR
        FROM created_at
    ) < 8
    OR (
        EXTRACT(
            HOUR
            FROM created_at
        ) = 8
        AND EXTRACT(
            MINUTE
            FROM created_at
        ) < 30
    )
    OR EXTRACT(
        HOUR
        FROM created_at
    ) >= 17;
-- 2. Mise à jour des LOGS (Piste d'audit)
UPDATE receipt_logs
SET created_at = start_time + (random() * diff)
WHERE EXTRACT(
        HOUR
        FROM created_at
    ) < 8
    OR (
        EXTRACT(
            HOUR
            FROM created_at
        ) = 8
        AND EXTRACT(
            MINUTE
            FROM created_at
        ) < 30
    )
    OR EXTRACT(
        HOUR
        FROM created_at
    ) >= 17;
-- 3. Mise à jour des PREUVES BANCAIRES (Bordereaux)
UPDATE solidaire_bank
SET date_heure_versement = start_time + (random() * diff)
WHERE EXTRACT(
        HOUR
        FROM date_heure_versement
    ) < 8
    OR (
        EXTRACT(
            HOUR
            FROM date_heure_versement
        ) = 8
        AND EXTRACT(
            MINUTE
            FROM date_heure_versement
        ) < 30
    )
    OR EXTRACT(
        HOUR
        FROM date_heure_versement
    ) >= 17;
END $$;