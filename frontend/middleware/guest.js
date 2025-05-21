export default function ({ store, redirect, route }) {
    // Si l'utilisateur est déjà connecté, le rediriger vers la page d'accueil
    if (store.state.auth.loggedIn) {
        return redirect('/')
    }

    // Stocker la page que l'utilisateur essayait d'atteindre
    localStorage.setItem('redirectPath', route.fullPath)
} 