// Middleware pour synchroniser le module @nuxtjs/auth-next avec notre système personnalisé
export default function ({ app, store, route }) {
  // Ne rien faire côté serveur
  if (!process.client) return;
  
  // Vérifier si notre service personnalisé existe
  if (!app.$authCustom) {
    console.log('[SYNC-AUTH] Service $authCustom non disponible sur la route:', route.path);
    return;
  }
  
  console.log('[SYNC-AUTH] ===== DÉBUT SYNCHRONISATION =====');
  console.log('[SYNC-AUTH] Route:', route.path);
  
  // Obtenir l'état d'authentification de notre système personnalisé
  const isAuthenticatedCustom = app.$authCustom.isAuthenticated();
  const user = app.$authCustom.getUser();
  const customToken = app.$authCustom.getToken();
  
  // Vérifier l'état d'authentification dans @nuxtjs/auth-next
  const isAuthenticatedNuxt = store.$auth && store.$auth.loggedIn;
  
  // Récupérer l'état du token depuis localStorage
  const hasTokenInStorage = process.client && localStorage.getItem('auth._token.local');
  const tokenValue = hasTokenInStorage ? localStorage.getItem('auth._token.local') : null;
  
  console.log('[SYNC-AUTH] États détaillés:', { 
    custom: isAuthenticatedCustom, 
    nuxt: isAuthenticatedNuxt,
    tokenInStorage: hasTokenInStorage ? 'présent' : 'absent',
    tokenPreview: tokenValue ? tokenValue.substring(0, 20) + '...' : 'aucun',
    customTokenPreview: customToken ? customToken.substring(0, 20) + '...' : 'aucun',
    user: user ? user.username : null,
    route: route.path,
    timestamp: new Date().toISOString()
  });
  
  // Nouvelle logique : ne considérer que l'état des systèmes d'authentification
  // et non pas uniquement le localStorage qui peut être corrompu
  
  if (isAuthenticatedCustom && user && customToken) {
    console.log('[SYNC-AUTH] ✅ Système personnalisé authentifié correctement');
    
    // Si notre système est authentifié mais pas Nuxt Auth, synchroniser
    if (!isAuthenticatedNuxt) {
      console.log('[SYNC-AUTH] Synchronisation Custom → Nuxt Auth');
      store.$auth.setUser(user);
      store.$auth.$storage.setState('loggedIn', true);
    }
    
    // Si le token dans localStorage est corrompu, le corriger
    if (!tokenValue || tokenValue === "false" || tokenValue === "undefined") {
      console.log('[SYNC-AUTH] Correction du token corrompu dans localStorage');
      localStorage.setItem('auth._token.local', customToken);
    }
  } else if (isAuthenticatedNuxt && store.$auth.user) {
    console.log('[SYNC-AUTH] ✅ Système Nuxt Auth authentifié');
    
    // Si Nuxt Auth est authentifié mais pas notre système, synchroniser
    if (!isAuthenticatedCustom) {
      console.log('[SYNC-AUTH] Synchronisation Nuxt Auth → Custom');
      app.$authCustom.setUser(store.$auth.user);
    }
  } else if (!isAuthenticatedCustom && !isAuthenticatedNuxt) {
    console.log('[SYNC-AUTH] ❌ Aucun système authentifié');
    
    // Seulement dans ce cas, on peut nettoyer
    if (tokenValue && tokenValue !== "false" && tokenValue !== "undefined") {
      console.log('[SYNC-AUTH] Token présent mais aucun système authentifié, vérification...');
      
      // Laisser une chance de récupération
      setTimeout(() => {
        app.$authCustom.fetchUser()
          .then(fetchedUser => {
            if (fetchedUser) {
              console.log('[SYNC-AUTH] ✅ Récupération réussie:', fetchedUser.username);
            } else {
              console.log('[SYNC-AUTH] ❌ Token invalide, nettoyage du localStorage');
              localStorage.removeItem('auth._token.local');
            }
          })
          .catch(err => {
            console.error('[SYNC-AUTH] ❌ Erreur de vérification:', err.message);
            if (err.response && err.response.status === 401) {
              console.log('[SYNC-AUTH] Token expiré, nettoyage');
              localStorage.removeItem('auth._token.local');
            }
          });
      }, 100);
    }
  } else {
    console.log('[SYNC-AUTH] ⚠️  État mixte détecté, pas d\'action');
  }
  
  console.log('[SYNC-AUTH] ===== FIN SYNCHRONISATION =====');
} 