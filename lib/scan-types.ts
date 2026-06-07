// Données extraites d'un document véhicule (toutes en string, telles que lues)
export interface DonneesVehicule {
    nom: string;
    nif: string;
    adresse: string;
    plaque: string;
    chassis: string;
    marque_type: string;
    cv: string;
    usage: string;
    genre: string;
    annee: string;
    couleur: string;
    poids: string;
}

// Une image prête à envoyer à l'API (base64 sans le préfixe data:)
export interface ImagePayload {
    base64: string;
    mediaType: string;
}

// Réponse structurée renvoyée par /api/extract
export interface ResultatExtraction {
    donnees: DonneesVehicule;
    champs_a_verifier: string[]; // clés de DonneesVehicule dont l'IA n'est pas sûre
    qualite_photo: 'bonne' | 'moyenne' | 'faible';
}
