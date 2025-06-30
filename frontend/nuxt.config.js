export default {
    // Configuration globale de la page
    head: {
        title: 'Ruche - Réseau Social Anonyme',
        meta: [
            { charset: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { hid: 'description', name: 'description', content: 'Ruche - Un réseau social où vous pouvez partager anonymement' }
        ],
        link: [
            { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
            { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css' }
        ]
    },

    // Modules globaux
    modules: [
        '@nuxtjs/axios',
        '@nuxtjs/auth-next',
        '@nuxtjs/toast',
    ],

    // Configuration Axios
    axios: {
        baseURL: process.env.API_URL || 'http://localhost:3000/api',
        browserBaseURL: process.env.BROWSER_BASE_URL || 'http://localhost:8080/api'
    },

    // Configuration Auth - désactiver les fonctionnalités automatiques
    auth: {
        strategies: {
            local: {
                endpoints: {
                    login: { url: '/auth/login', method: 'post' },
                    logout: false,
                    user: { url: '/auth/user', method: 'get' }
                },
                token: {
                    property: 'token',
                    required: true,
                    type: 'Bearer',
                    maxAge: false, // Désactiver la vérification automatique d'expiration
                    global: false  // Désactiver l'ajout automatique du token aux requêtes
                },
                user: {
                    property: 'user',
                    autoFetch: false
                },
                // Désactiver les intercepteurs automatiques
                autoLogout: false
            }
        },
        redirect: {
            login: '/auth/login',
            logout: '/',
            home: '/',
            register: '/auth/register'
        },
        // Désactiver les comportements automatiques
        watchLoggedIn: false,
        rewriteRedirects: false
    },

    // Configuration des toasts
    toast: {
        position: 'top-center',
        duration: 3000
    },

    // CSS global
    css: [
        '~/assets/css/main.css'
    ],

    // Plugins
    plugins: [
        '~/plugins/auth-custom.js',
        '~/plugins/axios.js',
        '~/plugins/filters.js',
        '~/plugins/components.js',
        '~/plugins/auth.js'
    ],

    // Build Config
    build: {

    },

    // Variables d'environnement
    publicRuntimeConfig: {
        axios: {
            browserBaseURL: process.env.BROWSER_BASE_URL || 'http://localhost:8080/api'
        }
    },

    // Middleware global
    router: {
        middleware: ['sync-auth']
    }
} 