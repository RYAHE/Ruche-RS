export default function ({ store, redirect, route }) {
    // Vérifier si nous sommes côté client (navigateur)
    if (process.client) {
        // Vérifier si l'utilisateur est connecté via le store
        const isLoggedInStore = store.state.auth && store.state.auth.loggedIn;
        
        // Vérifier si un token existe dans localStorage
        const token = localStorage.getItem('auth._token.local');
        
        // Si l'utilisateur n'est PAS connecté (ni via store ni via token), le rediriger vers la page de connexion
        if (!isLoggedInStore && !token) {
            // Stocker la page pour redirection après connexion
            localStorage.setItem('redirectPath', route.fullPath);
            return redirect('/auth/login');
        }
    } else {
        // Côté serveur, on ne peut vérifier que le store
        if (!store.state.auth || !store.state.auth.loggedIn) {
            return redirect('/auth/login');
        }
    }
} 