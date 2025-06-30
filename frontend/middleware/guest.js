export default function ({ store, redirect, route }) {
    // Vérifier si nous sommes côté client (navigateur) avant de vérifier localStorage
    if (process.client) {
        // Vérifier si l'utilisateur est connecté via le store
        const isLoggedInStore = store.state.auth && store.state.auth.loggedIn;
        
        // Vérifier si un token existe dans localStorage
        const token = localStorage.getItem('auth._token.local');
        
        // Si l'utilisateur est connecté (via store OU token), le rediriger vers la page d'accueil
        if (isLoggedInStore || token) {
            return redirect('/');
        }
        
        // Stocker la page que l'utilisateur essayait d'atteindre pour redirection après login
        localStorage.setItem('redirectPath', route.fullPath);
    } else {
        // Côté serveur, on ne peut vérifier que le store
        if (store.state.auth && store.state.auth.loggedIn) {
            return redirect('/');
        }
    }
} 