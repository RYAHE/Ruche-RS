<template>
  <div class="admin-dashboard">
    <div class="admin-header">
      <h1><i class="fas fa-shield-alt"></i> Tableau de bord administrateur</h1>
      <p>Gestion des posts anonymes et des utilisateurs</p>
    </div>

    <!-- Statistiques -->
    <div class="stats-section">
      <h2><i class="fas fa-chart-bar"></i> Statistiques</h2>
      <div class="stats-grid" v-if="stats">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats.totalUsers }}</h3>
            <p>Utilisateurs</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-file-alt"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats.totalPosts }}</h3>
            <p>Posts totaux</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-mask"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats.anonymousPosts }}</h3>
            <p>Posts anonymes</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-comments"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats.totalComments }}</h3>
            <p>Commentaires</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-heart"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats.totalLikes }}</h3>
            <p>Likes</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Posts avec informations complètes -->
    <div class="posts-section">
      <h2><i class="fas fa-eye"></i> Posts avec informations complètes</h2>
      <div class="filters">
        <input 
          type="text" 
          v-model="searchTerm" 
          placeholder="Rechercher dans les posts..."
          class="search-input"
        />
        <select v-model="selectedCategory" class="category-filter">
          <option value="">Toutes les catégories</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.nom }}
          </option>
        </select>
      </div>

      <div v-if="loading" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Chargement des posts...</span>
      </div>

      <div v-else-if="posts.length === 0" class="no-posts">
        <i class="fas fa-inbox"></i>
        <p>Aucun post trouvé</p>
      </div>

      <div v-else class="posts-grid">
        <div v-for="post in filteredPosts" :key="post.id" class="post-card admin-post">
          <div class="post-header">
            <div class="post-author">
              <i class="fas" :class="post.est_anonyme ? 'fa-mask' : 'fa-user-circle'"></i>
              <div class="author-info">
                <span class="author-name">
                  {{ post.est_anonyme ? 'Anonyme' : post.auteur }}
                  <span v-if="post.est_anonyme" class="anonymous-badge">🎭</span>
                </span>
                <span class="author-email" v-if="post.auteur_email">
                  {{ post.auteur_email }}
                </span>
                <span class="post-date">{{ formatDate(post.date_creation) }}</span>
              </div>
            </div>
            <div class="post-category">
              <span>{{ post.categorie_nom }}</span>
            </div>
          </div>

          <h3 class="post-title">{{ post.titre }}</h3>
          <div class="post-content">{{ post.contenu }}</div>

          <div class="post-meta">
            <span class="meta-item">
              <i class="fas fa-comment"></i>
              {{ post.nombre_commentaires || 0 }} commentaires
            </span>
            <span class="meta-item">
              <i class="fas fa-heart"></i>
              {{ post.nombre_likes || 0 }} likes
            </span>
            <span v-if="post.est_anonyme" class="meta-item anonymous-info">
              <i class="fas fa-user-secret"></i>
              Auteur réel: {{ post.auteur }} (ID: {{ post.auteur_id }})
            </span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminDashboard',
  
  head() {
    return {
      title: 'Administration - Ruche',
      meta: [
        { hid: 'description', name: 'description', content: 'Tableau de bord administrateur pour la gestion des posts anonymes' }
      ]
    }
  },

  data() {
    return {
      posts: [],
      categories: [],
      stats: null,
      loading: true,
      currentPage: 1,
      totalPages: 1,
      limit: 20,
      searchTerm: '',
      selectedCategory: ''
    }
  },

  computed: {
    filteredPosts() {
      let filtered = this.posts;

      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        filtered = filtered.filter(post => 
          post.titre.toLowerCase().includes(term) ||
          post.contenu.toLowerCase().includes(term) ||
          (post.auteur && post.auteur.toLowerCase().includes(term))
        );
      }

      if (this.selectedCategory) {
        filtered = filtered.filter(post => post.categorie_id == this.selectedCategory);
      }

      return filtered;
    }
  },

  async mounted() {
    await this.loadStats();
    await this.loadCategories();
    await this.loadPosts();
  },

  methods: {
    async loadStats() {
      try {
        const response = await this.$authCustom.makeRequest('/admin/stats', {
          method: 'GET'
        });
        this.stats = response.data.stats;
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        this.$toast.error('Erreur lors du chargement des statistiques');
      }
    },

    async loadCategories() {
      try {
        const response = await this.$authCustom.makeRequest('/categories', {
          method: 'GET'
        });
        this.categories = response.data;
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    },

    async loadPosts() {
      this.loading = true;
      try {
        const response = await this.$authCustom.makeRequest(`/admin/posts?page=${this.currentPage}&limit=${this.limit}`, {
          method: 'GET'
        });
        this.posts = response.data.posts;
        this.totalPages = Math.ceil(response.data.total / this.limit);
      } catch (error) {
        console.error('Erreur lors du chargement des posts:', error);
        this.$toast.error('Erreur lors du chargement des posts');
      } finally {
        this.loading = false;
      }
    },

    async changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        await this.loadPosts();
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.admin-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 15px;
}

.admin-header h1 {
  margin: 0 0 10px 0;
  font-size: 2.5rem;
}

.admin-header p {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.stats-section {
  margin-bottom: 40px;
}

.stats-section h2 {
  color: var(--text-color);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: var(--post-background);
  padding: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
  color: var(--primary-color);
}

.stat-content h3 {
  margin: 0;
  font-size: 1.8rem;
  color: var(--text-color);
}

.stat-content p {
  margin: 5px 0 0 0;
  color: var(--text-muted);
}

.posts-section {
  background: var(--post-background);
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.posts-section h2 {
  color: var(--text-color);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
}

.search-input,
.category-filter {
  padding: 12px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background: var(--background-color);
  color: var(--text-color);
  font-size: 1rem;
}

.search-input {
  flex: 1;
}

.category-filter {
  min-width: 200px;
}

.loading,
.no-posts {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

.loading i {
  font-size: 2rem;
  margin-bottom: 10px;
}

.posts-grid {
  display: grid;
  gap: 20px;
}

.admin-post {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 20px;
  transition: transform 0.2s ease;
}

.admin-post:hover {
  transform: translateY(-2px);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.post-author {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.post-author i {
  font-size: 1.5rem;
  color: var(--primary-color);
  margin-top: 2px;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-weight: 600;
  color: var(--text-color);
}

.author-email {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.post-date {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.post-category {
  background: rgba(255, 183, 0, 0.2);
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.8rem;
  color: var(--primary-color);
}

.post-title {
  margin: 0 0 10px 0;
  color: var(--text-color);
  font-size: 1.3rem;
}

.post-content {
  color: var(--text-color);
  margin-bottom: 15px;
  line-height: 1.6;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.anonymous-info {
  background: rgba(255, 68, 68, 0.1);
  color: #e74c3c;
  padding: 5px 10px;
  border-radius: 5px;
  font-weight: 600;
}

.anonymous-badge {
  margin-left: 5px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 30px;
}

.page-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-color);
  font-weight: 600;
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 10px;
  }

  .admin-header h1 {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .filters {
    flex-direction: column;
  }

  .post-header {
    flex-direction: column;
    gap: 10px;
  }

  .post-meta {
    flex-direction: column;
    gap: 10px;
  }
}
</style> 