// Système d'authentification personnalisé pour contourner les problèmes de @nuxtjs/auth-next
export default function ({ app, $axios, store, redirect }, inject) {
  // Stockage local de l'état d'authentification
  const authState = {
    user: null,
    loggedIn: false,
    token: null
  };

  // Système de journalisation pour le débogage
  const debug = process.client && window.location.hostname === 'localhost';
  const log = (...args) => {
    if (debug) console.log('[AUTH]', ...args);
  };

  // Méthodes d'authentification personnalisées
  const authCustom = {
    // Définir un utilisateur
    setUser(user) {
      log('setUser', user);
      authState.user = user;
      authState.loggedIn = !!user;
      
      // Mettre à jour aussi le store Nuxt Auth pour compatibilité
      if (store.$auth) {
        store.$auth.setUser(user);
        store.$auth.$storage.setState('loggedIn', !!user);
      }
      
      // Émettre un événement pour notifier les composants
      if (process.client && window) {
        window.dispatchEvent(new CustomEvent('auth-state-changed', {
          detail: { user, isAuthenticated: !!user }
        }));
      }
    },

    // Définir un token
    setToken(token) {
      log('setToken', token ? token.substring(0, 15) + '...' : 'null');
      
      if (token) {
        // S'assurer que le token commence par "Bearer "
        const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        authState.token = formattedToken;
        
        // Stocker dans localStorage côté client
        if (process.client) {
          localStorage.setItem('auth._token.local', formattedToken);
        }
        
        // Configurer axios
        $axios.setToken(formattedToken);
      } else {
        authState.token = null;
        
        if (process.client) {
          localStorage.removeItem('auth._token.local');
        }
        
        $axios.setToken(false);
      }
      
      // Émettre un événement pour notifier les composants
      if (process.client && window) {
        window.dispatchEvent(new CustomEvent('auth-state-changed', {
          detail: { token: !!token, isAuthenticated: authState.loggedIn }
        }));
      }
    },

    // Récupérer le token actuel
    getToken() {
      if (!authState.token && process.client) {
        const storedToken = localStorage.getItem('auth._token.local');
        if (storedToken && storedToken !== "false" && storedToken !== "undefined") {
          authState.token = storedToken;
        }
      }
      return authState.token;
    },

    // Connexion utilisateur
    async login(email, password) {
      log('login', email);
      
      // Nettoyer l'état existant
      authCustom.reset();
      
      try {
        // Faire la requête de connexion
        log('login - envoi requête...');
        const response = await $axios.$post('/auth/login', { email, password });
        log('login response', response);
        
        if (response && response.token) {
          // Formater et stocker le token
          const token = response.token.startsWith('Bearer ') ? 
            response.token : `Bearer ${response.token}`;
          
          log('login - token reçu:', token.substring(0, 20) + '...');
          authCustom.setToken(token);
          
          // Stocker l'utilisateur
          if (response.user) {
            log('login - utilisateur reçu:', response.user.username);
            authCustom.setUser(response.user);
          } else {
            // Si l'utilisateur n'est pas inclus dans la réponse, le récupérer séparément
            log('login - utilisateur non reçu, récupération du profil...');
            await authCustom.fetchUser();
          }
          
          // Vérifier l'état final
          log('login - état final:', {
            isAuthenticated: authCustom.isAuthenticated(),
            user: authCustom.getUser(),
            token: authCustom.getToken() ? 'présent' : 'absent'
          });
          
          // NE PAS rediriger automatiquement - laisser le composant gérer la redirection
          log('login - connexion réussie, pas de redirection automatique');
          
          return response;
        } else {
          log('login - pas de token dans la réponse:', response);
          throw new Error('Pas de token dans la réponse');
        }
      } catch (error) {
        log('login error', error.message);
        log('login error details:', error.response?.status, error.response?.data);
        
        // Réinitialiser l'état d'authentification en cas d'erreur
        authCustom.reset();
        
        // Propager l'erreur pour la gestion dans le composant
        throw error;
      }
    },

    // Inscription utilisateur
    async register(username, email, password) {
      log('register', { username, email });
      
      // Nettoyer l'état existant
      authCustom.reset();
      
      // Faire la requête d'inscription
      const response = await $axios.$post('/auth/register', { 
        username, email, password 
      });
      
      log('register response', response);
      
      if (response && response.token) {
        // Formater et stocker le token
        const token = response.token.startsWith('Bearer ') ? 
          response.token : `Bearer ${response.token}`;
        
        authCustom.setToken(token);
        
        // Stocker l'utilisateur
        if (response.user) {
          authCustom.setUser(response.user);
        }
        
        return response;
      } else {
        throw new Error('Pas de token dans la réponse');
      }
    },

    // Récupérer le profil utilisateur
    async fetchUser() {
      log('fetchUser');
      
      if (!authCustom.getToken()) {
        log('fetchUser - aucun token disponible');
        return null;
      }
      
      try {
        const baseURL = process.client ? 'http://localhost:8080/api' : 'http://backend:3000/api';
        log('fetchUser - URL du backend:', baseURL);
        
        // Créer une nouvelle instance axios pour cette requête spécifique
        const axios = require('axios').create({
          baseURL: baseURL,
          timeout: 5000, // Ajouter un timeout pour éviter les attentes infinies
          headers: {
            'Authorization': authCustom.getToken(),
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        log('fetchUser - envoi requête avec token:', authCustom.getToken().substring(0, 20) + '...');
        
        const response = await axios.get('/auth/user');
        log('fetchUser response status:', response.status);
        log('fetchUser response data:', response.data);
        
        if (response.data && response.data.user) {
          authCustom.setUser(response.data.user);
          return response.data.user;
        } else {
          log('fetchUser - format de réponse invalide:', response.data);
          return null;
        }
      } catch (error) {
        log('fetchUser error', error.message);
        log('fetchUser error details:', error.response?.status, error.response?.data);
        
        // Vérifier le type d'erreur et gérer en conséquence
        if (error.response && error.response.status === 401) {
          // Token invalide, déconnecter
          log('Token invalide (401), reset de l\'authentification');
          authCustom.reset();
        } else if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
          // Ne pas déconnecter en cas d'erreur réseau temporaire
          log('Erreur réseau temporaire, conservation du token');
        } else {
          // Pour les autres erreurs, on réinitialise pour éviter de rester dans un état incohérent
          log('Autre erreur, reset de l\'authentification par précaution');
          authCustom.reset();
        }
        
        return null;
      }
    },

    // Déconnexion
    async logout() {
      log('logout');
      
      // Nettoyer le stockage côté client
      if (process.client) {
        // Nettoyer localStorage
        localStorage.removeItem('auth._token.local');
        
        // Nettoyer tous les éléments liés à l'authentification
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('auth.') || key === 'auth')) {
            localStorage.removeItem(key);
          }
        }
      }
      
      // Réinitialiser l'état
      authCustom.reset();
      
      // Rediriger vers la page de connexion
      if (process.client) {
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 100);
      }
    },

    // Réinitialiser l'état
    reset() {
      log('reset');
      
      // Réinitialiser l'état local
      authState.user = null;
      authState.loggedIn = false;
      authState.token = null;
      
      // Réinitialiser Axios
      $axios.setToken(false);
      
      // Réinitialiser le store Nuxt Auth pour compatibilité
      if (store.$auth) {
        store.$auth.setUser(null);
        store.$auth.$storage.setState('loggedIn', false);
      }
      
      // Émettre un événement pour notifier les composants
      if (process.client && window) {
        window.dispatchEvent(new CustomEvent('auth-state-changed', {
          detail: { user: null, isAuthenticated: false, action: 'reset' }
        }));
      }
    },

    // Nettoyage complet de tous les tokens et données d'authentification
    fullCleanup() {
      log('fullCleanup - nettoyage complet de l\'authentification');
      
      if (process.client) {
        // Nettoyer tous les éléments du localStorage liés à l'authentification
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith('auth.') || 
            key === 'auth' || 
            key === 'auth._token.local' ||
            key.includes('token') ||
            key.includes('user')
          )) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => {
          log('Suppression de la clé:', key);
          localStorage.removeItem(key);
        });
        
        // Nettoyer sessionStorage aussi
        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (
            key.startsWith('auth.') || 
            key === 'auth' || 
            key.includes('token')
          )) {
            sessionKeysToRemove.push(key);
          }
        }
        
        sessionKeysToRemove.forEach(key => {
          log('Suppression de la clé session:', key);
          sessionStorage.removeItem(key);
        });
      }
      
      // Réinitialiser notre système
      authCustom.reset();
    },

    // Vérifier si l'utilisateur est connecté
    isAuthenticated() {
      return !!authState.user && !!authCustom.getToken();
    },

    // Récupérer l'utilisateur actuel
    getUser() {
      return authState.user;
    },

    // Faire une requête authentifiée
    async makeRequest(url, options = {}) {
      const token = authCustom.getToken();
      if (!token) {
        throw new Error('Aucun token d\'authentification disponible');
      }

      try {
        const config = {
          ...options,
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
          }
        };

        let response;
        const method = options.method?.toLowerCase() || 'get';

        switch (method) {
          case 'post':
            response = await $axios.post(url, options.data, config);
            break;
          case 'put':
            response = await $axios.put(url, options.data, config);
            break;
          case 'patch':
            response = await $axios.patch(url, options.data, config);
            break;
          case 'delete':
            response = await $axios.delete(url, config);
            break;
          default:
            response = await $axios.get(url, config);
        }

        return response;
      } catch (error) {
        // Si l'erreur est 401 (non autorisé), le token est probablement expiré
        if (error.response?.status === 401) {
          log('Token expiré ou invalide, déconnexion...');
          authCustom.logout();
        }
        throw error;
      }
    }
  };

  // Initialiser l'authentification au démarrage
  if (process.client) {
    // Faire un nettoyage complet au démarrage pour éviter les conflits
    log('Initialisation du système d\'authentification...');
    
    // Vérifier tous les tokens existants et les nettoyer s'ils sont corrompus
    const allTokens = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('token')) {
        const value = localStorage.getItem(key);
        allTokens.push({ key, value });
      }
    }
    
    log('Tokens trouvés dans localStorage:', allTokens);
    
    // Nettoyer tous les tokens invalides (false, undefined, null, etc.)
    let validToken = null;
    allTokens.forEach(({ key, value }) => {
      if (value === "false" || value === "undefined" || value === "null" || !value) {
        log('Suppression du token invalide:', key, value);
        localStorage.removeItem(key);
      } else if (key === 'auth._token.local' && value.startsWith('Bearer ')) {
        validToken = value;
      }
    });
    
    if (validToken) {
      log('Token valide trouvé, tentative de connexion...');
      authCustom.setToken(validToken);
      
      // Tenter de récupérer l'utilisateur après un délai
      setTimeout(() => {
        log('Vérification du token au démarrage...');
        authCustom.fetchUser()
          .then(user => {
            if (user) {
              log('Utilisateur authentifié avec succès:', user.username);
            } else {
              log('Token invalide, nettoyage complet...');
              authCustom.fullCleanup();
            }
          })
          .catch(error => {
            log('Erreur lors de la vérification du token:', error.message);
            if (error.response && error.response.status === 401) {
              log('Token expiré, nettoyage complet...');
              authCustom.fullCleanup();
            }
          });
      }, 800); // Délai plus long pour éviter les conflits
    } else {
      log('Aucun token valide trouvé, nettoyage complet...');
      authCustom.fullCleanup();
    }
  }

  // Injecter le service dans Nuxt
  inject('authCustom', authCustom);
} 