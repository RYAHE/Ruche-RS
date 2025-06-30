<template>
  <nav class="navbar">
    <!-- Logo de la ruche -->
    <div class="logo" @click="$router.push('/')">
      <i class="fas fa-honeycomb"></i>
      <span>Ruche</span>
    </div>

    <!-- Barre de recherche -->
    <div class="search-bar">
      <input type="text" v-model="searchQuery" @keyup.enter="search" placeholder="Rechercher dans la ruche..." />
      <button @click="search" class="search-btn">
        <i class="fas fa-search"></i>
      </button>
    </div>

    <!-- Sélecteur de catégorie -->
    <div class="category-filter">
      <label for="categoryFilter">Catégorie :</label>
      <select id="categoryFilter" v-model="selectedCategory" @change="filterByCategory">
        <option value="all">ALL</option>
        <option v-for="category in categories" :key="category.id" :value="category.id">
          {{ category.nom }}
        </option>  
      </select>
    </div>

    <!-- Actions de navigation -->
    <div class="nav-actions">
      <!-- Boutons d'authentification (si non connecté) -->
      <div class="auth-buttons" v-if="!isUserLoggedIn">
        <button class="login-btn" @click="goToLogin">Connexion</button>
        <button class="register-btn" @click="goToRegister">Inscription</button>
      </div>

      <!-- Profil utilisateur (si connecté) -->
      <div class="user-profile" v-else>
        <div class="user-menu-trigger" @click="toggleUserMenu">
          <i class="fas fa-user-circle"></i>
          <span class="username">{{ userName }}</span>
          <i class="fas fa-chevron-down"></i>
        </div>

        <!-- Menu utilisateur -->
        <div class="user-menu" v-if="showUserMenu">
          <div class="user-menu-header">
            <i class="fas fa-user-circle"></i>
            <div class="user-info">
              <span class="username">{{ userName }}</span>
              <span class="user-email">{{ userEmail }}</span>
            </div>
          </div>

          <div class="user-menu-items">
            <button class="menu-item debug-btn" v-if="isDebugMode" @click="checkAuthState">
              <i class="fas fa-bug"></i>
              Vérifier Auth
            </button>
            <button class="menu-item debug-btn" v-if="isDebugMode" @click="showDebugLogs">
              <i class="fas fa-file-alt"></i>
              Voir Logs Debug
            </button>
            <button class="menu-item admin-btn" v-if="isAdmin" @click="navigateTo('/admin')">
              <i class="fas fa-shield-alt"></i>
              Administration
            </button>
            <button class="menu-item" @click="navigateTo('/profile')">
              <i class="fas fa-id-card"></i>
              Mon Profil
            </button>
            <button class="menu-item" @click="navigateTo('/my-posts')">
              <i class="fas fa-list"></i>
              Mes Posts
            </button>
            <button class="menu-item" @click="navigateTo('/settings')">
              <i class="fas fa-cog"></i>
              Paramètres
            </button>
            <div class="menu-separator"></div>
            <button class="menu-item logout-btn" @click="logout">
              <i class="fas fa-sign-out-alt"></i>
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  data() {
    return {
      searchQuery: '',
      selectedCategory: 'all',
      categories: [],
      showUserMenu: false,
      isDebugMode: process.env.NODE_ENV === 'development',
      authUpdateTrigger: 0
    }
  },

  computed: {
    isUserLoggedIn() {
      this.authUpdateTrigger;
      return this.$authCustom && this.$authCustom.isAuthenticated();
    },
    
    userName() {
      this.authUpdateTrigger;
      const user = this.$authCustom && this.$authCustom.getUser();
      return user ? user.username : 'Utilisateur';
    },
    
    userEmail() {
      this.authUpdateTrigger;
      const user = this.$authCustom && this.$authCustom.getUser();
      return user ? user.email : '';
    },

    isAdmin() {
      this.authUpdateTrigger;
      const user = this.$authCustom && this.$authCustom.getUser();
      return user ? user.est_admin : false;
    }
  },

  watch: {
    '$authCustom': {
      handler() {
        console.log('[NAVBAR] Changement détecté dans $authCustom');
        this.forceUpdate();
      },
      deep: true
    }
  },

  async mounted() {
    // Écouter les événements d'authentification personnalisés
    if (process.client) {
      // Ajouter un listener pour les changements d'état d'authentification
      window.addEventListener('auth-state-changed', this.handleAuthStateChange);
      
      // Forcer une mise à jour initiale
      this.$nextTick(() => {
        this.forceUpdate();
      });
    }

    try {
      // Vérifier d'abord que $axios est disponible
      if (!this.$axios) {
        console.error('Erreur: $axios n\'est pas disponible');
        this.categories = [];
        return;
      }
      
      try {
        const response = await this.$axios.get('/categories');
        if (response && response.data && response.data.categories) {
          this.categories = response.data.categories;
        } else {
          console.warn('Format de réponse inattendu pour les catégories:', response);
          this.categories = [];
        }
      } catch (apiError) {
        console.error('Erreur lors du chargement des catégories:', apiError);
        this.$toast.error('Impossible de charger les catégories');
        this.categories = [];
      }
    } catch (error) {
      console.error('Erreur globale dans le composant Navbar:', error);
      this.categories = [];
    }
  },

  beforeDestroy() {
    // Nettoyer les listeners d'événements
    if (process.client) {
      window.removeEventListener('auth-state-changed', this.handleAuthStateChange);
    }
  },

  methods: {
    // Gestionnaire pour les changements d'état d'authentification
    handleAuthStateChange(event) {
      console.log('[NAVBAR] Événement auth-state-changed reçu:', event.detail);
      this.forceUpdate();
    },

    // Méthode pour forcer la mise à jour de l'interface
    forceUpdate() {
      this.authUpdateTrigger++;
      console.log('[NAVBAR] Force update triggered:', {
        isAuthenticated: this.isUserLoggedIn,
        userName: this.userName,
        userEmail: this.userEmail
      });
    },

    search() {
      if (this.searchQuery.trim()) {
        this.$router.push(`/search?q=${encodeURIComponent(this.searchQuery.trim())}`)
      }
    },

    filterByCategory() {
      if (this.selectedCategory === 'all') {
        this.$router.push('/?exclude=NSFW')
      } else {
        // Trouver la catégorie correspondante pour obtenir son nom
        const category = this.categories.find(cat => cat.id === this.selectedCategory)
        if (category) {
          // Mapper les noms vers les URLs appropriées selon les nouvelles catégories
          const categoryMapping = {
            'random': 'random',
            'annonces': 'annonces',
            'questions': 'questions',
            'vg': 'vg',
            'nsfw': 'nsfw'
          }
          
          const categoryName = category.nom.toLowerCase()
          const routeName = categoryMapping[categoryName]
          
          if (routeName) {
            this.$router.push(`/category/${routeName}`)
          } else {
            // Si pas de mapping trouvé, utiliser l'ID comme avant (page dynamique)
            this.$router.push(`/category/${this.selectedCategory}`)
          }
        } else {
          // Fallback vers l'accueil si catégorie non trouvée
          this.$router.push('/')
        }
      }
    },

    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu
    },

    goToLogin() {
      const baseUrl = window.location.origin;
      window.location.href = `${baseUrl}/auth/login`;
    },
    
    goToRegister() {
      this.$router.push('/auth/register');
    },

    navigateTo(path) {
      this.showUserMenu = false
      this.$router.push(path)
    },

    async logout() {
      try {
        await this.$authCustom.logout();
        
        this.forceUpdate();
        
        this.$toast.success('Vous êtes déconnecté');
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        this.$toast.error('Erreur lors de la déconnexion');
        
        if (process.client) {
          localStorage.clear();
          window.location.href = '/auth/login';
        }
      }
    },

    checkAuthState() {
      const authCustomState = {
        isAuthenticated: this.$authCustom.isAuthenticated(),
        user: this.$authCustom.getUser(),
        token: this.$authCustom.getToken() ? 'Présent' : 'Absent'
      };
      
      const authNuxtState = {
        isLoggedIn: this.$auth && this.$auth.loggedIn,
        user: this.$auth && this.$auth.user,
        strategy: this.$auth && this.$auth.strategy,
        token: process.client && localStorage.getItem('auth._token.local') ? 'Présent' : 'Absent'
      };
      
      console.log('=== ÉTAT D\'AUTHENTIFICATION ===');
      console.log('Auth Custom:', authCustomState);
      console.log('Auth Nuxt:', authNuxtState);
      
      this.$toast.info(`Auth Custom: ${authCustomState.isAuthenticated ? 'Connecté' : 'Déconnecté'} | 
                         Auth Nuxt: ${authNuxtState.isLoggedIn ? 'Connecté' : 'Déconnecté'}`);
      
      if (authCustomState.isAuthenticated && !authNuxtState.isLoggedIn) {
        this.$auth.setUser(authCustomState.user);
        this.$auth.$storage.setState('loggedIn', true);
        this.$toast.success('Synchronisation Custom → Nuxt effectuée');
      } else if (!authCustomState.isAuthenticated && authNuxtState.isLoggedIn) {
        this.$authCustom.setUser(authNuxtState.user);
        this.$toast.success('Synchronisation Nuxt → Custom effectuée');
      }
      
      this.forceUpdate();
    },

    showDebugLogs() {
      const debugLogs = localStorage.getItem('debug_logs');
      if (debugLogs) {
        const logs = JSON.parse(debugLogs);
        console.log('=== LOGS DE DEBUG ===');
        logs.forEach((log, index) => {
          console.log(`${index + 1}. [${log.timestamp}] ${log.message}`);
          if (log.data) {
            console.log('   Data:', JSON.parse(log.data));
          }
        });
        alert(`${logs.length} logs trouvés. Voir la console pour les détails.\n\nDernier log: ${logs[logs.length - 1]?.message || 'Aucun'}`);
      } else {
        alert('Aucun log de debug trouvé dans localStorage');
      }
      
      // Afficher aussi l'état actuel
      console.log('=== ÉTAT ACTUEL ===');
      console.log('Auth Custom:', {
        isAuthenticated: this.$authCustom?.isAuthenticated(),
        user: this.$authCustom?.getUser(),
        token: this.$authCustom?.getToken()?.substring(0, 20) + '...'
      });
      console.log('localStorage tokens:', {
        authToken: localStorage.getItem('auth._token.local')?.substring(0, 20) + '...'
      });
    }
  }
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--post-background);
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 1000;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  color: var(--primary-color);
  cursor: pointer;
}

.search-bar {
  position: relative;
  width: 300px;
}

.search-bar input {
  width: 100%;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: none;
  background-color: var(--background-color);
  color: var(--text-color);
}

.search-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
}

.category-filter select {
  padding: 0.5rem;
  border-radius: 5px;
  background-color: var(--background-color);
  color: var(--text-color);
  border: none;
}

.auth-buttons button,
.menu-item {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  margin-left: 0.5rem;
}

.login-btn {
  background-color: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.register-btn {
  background-color: var(--primary-color);
  color: var(--background-color);
}

.user-profile {
  position: relative;
}

.user-menu-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 20px;
}

.user-menu-trigger:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.user-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 250px;
  background-color: var(--post-background);
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  z-index: 1001;
  overflow: hidden;
}

.user-menu-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-email {
  font-size: 0.8rem;
  color: #888;
}

.user-menu-items {
  padding: 0.5rem;
}

.menu-item {
  width: 100%;
  text-align: left;
  border-radius: 5px;
  margin: 0.2rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.menu-separator {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;
}

.logout-btn {
  color: #ff4444;
}

.debug-btn {
  background-color: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.admin-btn {
  background-color: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

@media (max-width: 768px) {
  .navbar {
    flex-wrap: wrap;
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .logo {
    font-size: 1.2rem;
  }

  .search-bar {
    order: 4;
    width: 100%;
    margin-top: 0.5rem;
  }

  .category-filter {
    order: 5;
    width: 100%;
    margin-top: 0.5rem;
  }

  .nav-actions {
    margin-left: auto;
    order: 2;
  }

  .user-menu {
    right: 0.5rem;
    width: 200px;
  }
}

@media (max-width: 480px) {
  .navbar {
    padding: 0.3rem;
  }

  .category-filter {
    min-width: calc(25% - 0.375rem);
    padding: 0.5rem 0.3rem;
  }

  .category-filter select {
    font-size: 0.8rem;
  }
}
</style>