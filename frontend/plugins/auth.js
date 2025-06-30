export default function ({ $auth, $axios, app }) {
  // Désactiver complètement les intercepteurs et la validation automatique de @nuxtjs/auth-next
  console.log('[AUTH-PLUGIN] Désactivation des intercepteurs @nuxtjs/auth-next');
  
  // Désactiver la validation de token automatique
  if ($auth && $auth.strategy && $auth.strategy.token) {
    // Forcer tokenValid à toujours retourner true pour éviter ExpiredAuthSessionError
    $auth.strategy.token.tokenValid = () => {
      console.log('[AUTH-PLUGIN] tokenValid() forcé à true');
      return true;
    };
    
    // Désactiver la vérification d'expiration
    $auth.strategy.token.expired = () => {
      console.log('[AUTH-PLUGIN] expired() forcé à false');
      return false;
    };
    
    // Désactiver le rafraîchissement automatique
    $auth.strategy.refreshToken = {
      expired: () => false,
      tokenValid: () => true
    };
  }
  
  // Supprimer les intercepteurs axios de @nuxtjs/auth-next s'ils existent
  if ($axios && $axios.interceptors) {
    // Vider les intercepteurs de requête auth
    const requestInterceptors = $axios.interceptors.request.handlers || [];
    console.log('[AUTH-PLUGIN] Nombre d\'intercepteurs de requête avant nettoyage:', requestInterceptors.length);
    
    // Filtrer pour garder seulement nos intercepteurs personnalisés
    $axios.interceptors.request.handlers = requestInterceptors.filter(interceptor => {
      // Garder seulement les intercepteurs qui ne viennent pas de @nuxtjs/auth-next
      return !interceptor || !interceptor.toString().includes('auth');
    });
    
    // Vider les intercepteurs de réponse auth  
    const responseInterceptors = $axios.interceptors.response.handlers || [];
    console.log('[AUTH-PLUGIN] Nombre d\'intercepteurs de réponse avant nettoyage:', responseInterceptors.length);
    
    $axios.interceptors.response.handlers = responseInterceptors.filter(interceptor => {
      // Garder seulement les intercepteurs qui ne viennent pas de @nuxtjs/auth-next
      return !interceptor || !interceptor.toString().includes('auth');
    });
    
    console.log('[AUTH-PLUGIN] Intercepteurs nettoyés');
  }
  
  // Désactiver les watchers automatiques
  if ($auth && $auth.watchState) {
    $auth.watchState = () => {};
    console.log('[AUTH-PLUGIN] Watchers désactivés');
  }
  
  // Désactiver la récupération automatique des données utilisateur
  if ($auth && $auth.fetchUser) {
    const originalFetchUser = $auth.fetchUser;
    $auth.fetchUser = () => {
      console.log('[AUTH-PLUGIN] fetchUser() désactivé - utiliser $authCustom.fetchUser()');
      return Promise.resolve(null);
    };
  }
  
  console.log('[AUTH-PLUGIN] Configuration terminée - système personnalisé actif');
} 