DO $$
DECLARE -- Plage cible : 04 Février 2026
    start_time timestamp := '2026-02-04 08:30:00';
end_time timestamp := '2026-02-04 11:19:00';
diff interval := end_time - start_time;
BEGIN -- 1. Declarations (Colonne "createdAt")
-- Utilisation de EXTRACT pour éviter les erreurs de parsing
UPDATE declarations
SET "createdAt" = start_time + (random() * diff)
WHERE EXTRACT(
        HOUR
        FROM "createdAt"::timestamp
    ) < 8
    OR EXTRACT(
        HOUR
        FROM "createdAt"::timestamp
    ) >= 17;
-- 2. Logs (Colonne created_at)
UPDATE receipt_logs
SET created_at = start_time + (random() * diff)
WHERE EXTRACT(
        HOUR
        FROM created_at::timestamp
    ) < 8
    OR EXTRACT(
        HOUR
        FROM created_at::timestamp
    ) >= 17;
-- 3. Banque (Colonne date_heure_versement)
UPDATE solidaire_bank
SET date_heure_versement = start_time + (random() * diff)
WHERE EXTRACT(
        HOUR
        FROM date_heure_versement::timestamp
    ) < 8
    OR EXTRACT(
        HOUR
        FROM date_heure_versement::timestamp
    ) >= 17;
END $$;