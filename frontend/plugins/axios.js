export default function ({ $axios, redirect, store, $toast }) {
    // Intercepteur de requête
    $axios.onRequest(config => {
        console.log('Requête envoyée vers ' + config.url)
        return config
    })

    // Intercepteur d'erreur
    $axios.onError(error => {
        const code = parseInt(error.response && error.response.status)

        if (code === 401) {
            // Erreur d'authentification
            $toast.error('Session expirée. Veuillez vous reconnecter.')
            redirect('/auth/login')
        }

        if (code === 403) {
            // Accès non autorisé
            $toast.error('Vous n\'avez pas les droits nécessaires pour cette action.')
        }

        if (code === 404) {
            // Ressource non trouvée
            $toast.error('La ressource demandée n\'existe pas.')
        }

        if (code === 500) {
            // Erreur serveur
            $toast.error('Une erreur est survenue sur le serveur. Veuillez réessayer plus tard.')
        }

        return Promise.reject(error)
    })
} 