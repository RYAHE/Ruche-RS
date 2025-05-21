export default function ({ $axios, redirect, store, $toast }) {
    // Configuration de l'URL de base pour les requêtes côté client
    if (process.client) {
        $axios.defaults.baseURL = 'http://localhost:8080/api';
    }

    // Intercepteur pour les requêtes
    $axios.onRequest(config => {
        console.log('Requête envoyée vers ' + config.url);
        return config;
    });

    // Intercepteur pour les réponses
    $axios.onResponse(response => {
        return response;
    });

    // Intercepteur pour les erreurs
    $axios.onError(error => {
        const code = parseInt(error.response && error.response.status);

        if (code === 404) {
            console.error('Ressource non trouvée:', error.config.url);
            $toast.error('Ressource non trouvée');
        }

        if (code === 401 || code === 403) {
            console.error('Non autorisé');
            $toast.error('Vous n\'êtes pas autorisé à effectuer cette action');

            // Si l'utilisateur n'est pas authentifié, le rediriger vers la page de connexion
            if (store.state.auth && !store.state.auth.loggedIn) {
                redirect('/auth/login');
            }
        }

        return Promise.reject(error);
    });
} 