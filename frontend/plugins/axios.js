export default function ({ $axios, redirect, store, $toast }) {
    // Configuration de l'URL de base pour les requêtes côté client
    if (process.client) {
        $axios.defaults.baseURL = 'http://localhost:8080/api';
        
        // Ajouter un indicateur de debug global
        window.debugAuth = true;
    }

    // Intercepteur pour les requêtes
    $axios.onRequest(config => {
        if (process.client && window.debugAuth) {
            console.log('[AXIOS-INTERCEPTOR] Requête envoyée vers ' + config.url);
        }
        
        // Vérifier si on est côté client (browser)
        if (process.client) {
            const token = localStorage.getItem('auth._token.local');
            if (token && token !== "false" && token !== "undefined") {
                // Déboguer les headers d'authentification
                if (window.debugAuth) {
                    console.log('[AXIOS-INTERCEPTOR] Token appliqué:', token.substring(0, 15) + '...');
                }
                
                // Appliquer le token à la requête
                config.headers.common['Authorization'] = token;
            } else {
                if (window.debugAuth) {
                    console.log('[AXIOS-INTERCEPTOR] Aucun token valide trouvé');
                }
            }
        }
        
        return config;
    });

    // Intercepteur d'erreur simplifié - pas de gestion automatique des 401
    $axios.onError(error => {
        // Vérifier que error.config existe pour éviter les erreurs
        if (!error || !error.config) {
            console.error('[AXIOS-INTERCEPTOR] Erreur Axios sans objet config:', error);
            return Promise.reject(error);
        }
        
        const code = parseInt(error.response && error.response.status);
        const url = error.config.url || 'URL inconnue';

        // Déboguer toutes les erreurs
        if (process.client && window.debugAuth) {
            console.log(`[AXIOS-INTERCEPTOR] Erreur ${code} sur ${url}:`, {
                message: error.response?.data?.message || 'Pas de message',
                headers: error.config.headers
            });
        }

        // Gestion des erreurs basiques seulement
        if (code === 404) {
            console.error('[AXIOS-INTERCEPTOR] Ressource non trouvée:', url);
            $toast.error('Ressource non trouvée');
        } else if (code === 403) {
            console.error('[AXIOS-INTERCEPTOR] Non autorisé:', url);
            $toast.error('Vous n\'avez pas les permissions nécessaires');
        } else if (code === 500) {
            console.error('[AXIOS-INTERCEPTOR] Erreur serveur:', url);
            $toast.error('Erreur serveur. Veuillez réessayer plus tard.');
        }

        // Laisser l'erreur se propager pour être gérée par les composants
        return Promise.reject(error);
    });
} 