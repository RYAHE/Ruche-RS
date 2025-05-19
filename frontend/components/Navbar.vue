<template>
  <nav class="navbar">
    <!-- Logo de la ruche -->
    <div class="logo" @click="$router.push('/')">
      <i class="fas fa-honeycomb"></i>
      <span>Ruche</span>
    </div>
    
    <!-- Barre de recherche -->
    <div class="search-bar">
      <input 
        type="text" 
        v-model="searchQuery" 
        @keyup.enter="search"
        placeholder="Rechercher dans la ruche..." 
      />
      <button @click="search" class="search-btn">
        <i class="fas fa-search"></i>
      </button>
    </div>
    
    <!-- Sélecteur de catégorie -->
    <div class="category-filter">
      <label for="categoryFilter">Catégorie :</label>
      <select id="categoryFilter" v-model="selectedCategory" @change="filterByCategory">
        <option value="all">Toutes</option>
        <option v-for="category in categories" :key="category.id" :value="category.id">
          {{ category.nom }}
        </option>
      </select>
    </div>
    
    <!-- Actions de navigation -->
    <div class="nav-actions">
      <!-- Boutons d'authentification (si non connecté) -->
      <div class="auth-buttons" v-if="!$auth.loggedIn">
        <button class="login-btn" @click="$router.push('/auth/login')">Connexion</button>
        <button class="register-btn" @click="$router.push('/auth/register')">Inscription</button>
      </div>
      
      <!-- Profil utilisateur (si connecté) -->
      <div class="user-profile" v-else>
        <div class="user-menu-trigger" @click="toggleUserMenu">
          <i class="fas fa-user-circle"></i>
          <span class="username">{{ $auth.user.username }}</span>
          <i class="fas fa-chevron-down"></i>
        </div>
        
        <!-- Menu utilisateur -->
        <div class="user-menu" v-if="showUserMenu">
          <div class="user-menu-header">
            <i class="fas fa-user-circle"></i>
            <div class="user-info">
              <span class="username">{{ $auth.user.username }}</span>
              <span class="user-email">{{ $auth.user.email }}</span>
            </div>
          </div>
          
          <div class="user-menu-items">
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
      showUserMenu: false
    }
  },
  
  async mounted() {
    try {
      const response = await this.$axios.get('/categories')
      this.categories = response.data.categories
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error)
      this.$toast.error('Impossible de charger les catégories')
    }
  },
  
  methods: {
    search() {
      if (this.searchQuery.trim()) {
        this.$router.push(`/search?q=${encodeURIComponent(this.searchQuery.trim())}`)
      }
    },
    
    filterByCategory() {
      if (this.selectedCategory === 'all') {
        this.$router.push('/')
      } else {
        this.$router.push(`/category/${this.selectedCategory}`)
      }
    },
    
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu
    },
    
    navigateTo(path) {
      this.showUserMenu = false
      this.$router.push(path)
    },
    
    async logout() {
      try {
        await this.$auth.logout()
        this.$toast.success('Vous êtes déconnecté')
        this.$router.push('/')
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error)
        this.$toast.error('Erreur lors de la déconnexion')
      }
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

.auth-buttons button, .menu-item {
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

@media (max-width: 768px) {
  .navbar {
    flex-wrap: wrap;
    padding: 0.5rem;
  }
  
  .search-bar, .category-filter {
    order: 3;
    width: 100%;
    margin-top: 0.5rem;
  }
  
  .nav-actions {
    margin-left: auto;
  }
}
</style> 