<template>
  <div class="category-page">
    <!-- Header simplifié -->
    <div class="category-header">
      <div class="header-content">
        <div class="icon-section">
          <i :class="categoryIcon"></i>
        </div>
        <div class="text-section">
          <h1 class="category-title">{{ categoryName }}</h1>
        </div>
      </div>
    </div>

    <!-- Contenu principal -->
    <div class="main-content">
      <!-- Bouton de création flottant -->
      <button 
        v-if="$authCustom && $authCustom.isAuthenticated()" 
        class="floating-create-btn" 
        @click="showNewPostModal = true"
      >
        <i class="fas fa-plus"></i>
      </button>

      <!-- Liste des posts -->
      <div class="posts-section">
        <div v-if="loading" class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          Chargement des posts...
        </div>

        <div v-else-if="posts.length === 0" class="no-posts">
          <i :class="categoryIcon"></i>
          <h3>Aucun post dans cette catégorie</h3>
          <p>Soyez le premier à publier !</p>
        </div>

        <div v-else class="posts-grid">
          <PostCard 
            v-for="post in posts" 
            :key="post.id" 
            :post="post"
            @edit="openEditModal"
            @delete="openDeleteModal"
          />
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            @click="changePage(currentPage - 1)" 
            :disabled="currentPage === 1"
            class="pagination-btn"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          
          <span class="page-info">
            Page {{ currentPage }} sur {{ totalPages }}
          </span>
          
          <button 
            @click="changePage(currentPage + 1)" 
            :disabled="currentPage === totalPages"
            class="pagination-btn"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <!-- Modal de création -->
      <div v-if="showNewPostModal" class="modal-overlay" @click="showNewPostModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3><i :class="categoryIcon"></i> Nouveau post - {{ categoryName }}</h3>
            <button @click="showNewPostModal = false" class="close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label for="postTitle">Titre *</label>
              <input 
                id="postTitle"
                v-model="newPost.titre" 
                type="text" 
                placeholder="Titre de votre post"
                required
              />
            </div>

            <div class="form-group">
              <label for="postContent">Contenu *</label>
              <textarea 
                id="postContent"
                v-model="newPost.contenu" 
                placeholder="Décrivez votre contenu..."
                rows="6"
                :maxlength="maxContentLength"
                required
              ></textarea>
              <div class="character-counter" :class="getCounterClass">
                {{ newPost.contenu.length }} / {{ maxContentLength }}
              </div>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="newPost.estAnonyme"
                />
                <span class="checkmark"></span>
                Publier de manière anonyme
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="showNewPostModal = false" class="cancel-btn">
              Annuler
            </button>
            <button 
              @click="createPost" 
              :disabled="!isPostValid"
              class="submit-btn"
            >
              <i class="fas fa-paper-plane"></i>
              Publier
            </button>
          </div>
        </div>
      </div>

      <!-- Modal d'édition -->
      <div v-if="showEditModal" class="modal-overlay" @click="showEditModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3><i class="fas fa-edit"></i> Modifier le post</h3>
            <button @click="showEditModal = false" class="close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label for="editTitle">Titre *</label>
              <input 
                id="editTitle"
                v-model="editingPost.titre" 
                type="text" 
                required
              />
            </div>

            <div class="form-group">
              <label for="editContent">Contenu *</label>
              <textarea 
                id="editContent"
                v-model="editingPost.contenu" 
                rows="6"
                :maxlength="maxContentLength"
                required
              ></textarea>
              <div class="character-counter" :class="getEditCounterClass">
                {{ editingPost.contenu.length }} / {{ maxContentLength }}
              </div>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="editingPost.estAnonyme"
                />
                <span class="checkmark"></span>
                Publier de manière anonyme
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="showEditModal = false" class="cancel-btn">
              Annuler
            </button>
            <button 
              @click="updatePost" 
              :disabled="!isEditValid"
              class="submit-btn"
            >
              <i class="fas fa-save"></i>
              Sauvegarder
            </button>
          </div>
        </div>
      </div>

      <!-- Modal de suppression -->
      <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
        <div class="modal-content delete-modal" @click.stop>
          <div class="modal-header">
            <h3><i class="fas fa-exclamation-triangle"></i> Confirmer la suppression</h3>
            <button @click="showDeleteModal = false" class="close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <p>Êtes-vous sûr de vouloir supprimer ce post ?</p>
            <p><strong>{{ postToDelete?.titre }}</strong></p>
            <p class="warning-text">Cette action est irréversible.</p>
          </div>

          <div class="modal-footer">
            <button @click="showDeleteModal = false" class="cancel-btn">
              Annuler
            </button>
            <button @click="deletePost" class="delete-btn">
              <i class="fas fa-trash"></i>
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PostCard from '~/components/PostCard.vue'

export default {
  name: 'CategoryDynamic',
  components: {
    PostCard
  },
  
  head() {
    return {
      title: `${this.categoryName} - Ruche`,
      meta: [
        { hid: 'description', name: 'description', content: `Posts de la catégorie ${this.categoryName}` }
      ]
    }
  },

  data() {
    return {
      posts: [],
      loading: true,
      currentPage: 1,
      totalPages: 1,
      limit: 10,
      category: null,
      showNewPostModal: false,
      showEditModal: false,
      showDeleteModal: false,
      newPost: {
        titre: '',
        contenu: '',
        categorieId: null,
        estAnonyme: false
      },
      editingPost: {
        id: null,
        titre: '',
        contenu: '',
        categorieId: null,
        estAnonyme: false
      },
      postToDelete: null,
      maxContentLength: 5000
    }
  },

  computed: {
    categoryParam() {
      return this.$route.params.id
    },

    categoryName() {
      return this.category ? this.category.nom : 'Catégorie'
    },

    categoryIcon() {
      const icons = {
        'random': 'fas fa-random',
        'annonces': 'fas fa-bullhorn',
        'questions': 'fas fa-question-circle',
        'vg': 'fas fa-gamepad',
        'nsfw': 'fas fa-exclamation-triangle'
      }
      
      return this.category ? icons[this.category.nom.toLowerCase()] || 'fas fa-folder' : 'fas fa-folder'
    },

    isPostValid() {
      return this.newPost.titre.trim() &&
        this.newPost.contenu.trim()
    },

    isEditValid() {
      return this.editingPost.titre.trim() &&
        this.editingPost.contenu.trim()
    },

    getCounterClass() {
      const length = this.newPost.contenu.length
      if (length > this.maxContentLength * 0.9) return 'limit-near'
      if (length >= this.maxContentLength) return 'limit-reached'
      return ''
    },

    getEditCounterClass() {
      const length = this.editingPost.contenu.length
      if (length > this.maxContentLength * 0.9) return 'limit-near'
      if (length >= this.maxContentLength) return 'limit-reached'
      return ''
    }
  },

  async mounted() {
    await this.loadCategory()
    if (this.category) {
      await this.loadPosts()
    }
  },

  methods: {
    async loadCategory() {
      try {
        const param = this.categoryParam
        
        // Récupérer toutes les catégories
        const response = await this.$axios.get('/categories')
        if (response.data.categories) {
          let category = null
          
          // Essayer de trouver par ID d'abord
          if (!isNaN(param)) {
            category = response.data.categories.find(cat => cat.id === parseInt(param))
          }
          
          // Si pas trouvé par ID, essayer par nom
          if (!category) {
            const nameMapping = {
              'random': ['random'],
              'annonces': ['annonces'],
              'questions': ['questions'],
              'vg': ['vg'],
              'nsfw': ['nsfw']
            }
            
            for (const [route, names] of Object.entries(nameMapping)) {
              if (param === route) {
                category = response.data.categories.find(cat => 
                  names.includes(cat.nom.toLowerCase())
                )
                break
              }
            }
          }
          
          if (category) {
            this.category = category
            this.newPost.categorieId = category.id
          } else {
            console.error('Catégorie non trouvée:', param)
            this.$toast.error('Catégorie non trouvée')
            this.$router.push('/')
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la catégorie:', error)
        this.$toast.error('Erreur lors du chargement de la catégorie')
        this.$router.push('/')
      }
    },

    async loadPosts() {
      if (!this.category) return
      
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          limit: this.limit
        }

        const response = await this.$axios.get(`/posts/category/${this.category.id}`, { params })
        
        if (response.data) {
          this.posts = response.data.posts || []
          this.totalPages = response.data.totalPages || 1
        }
      } catch (error) {
        console.error('Erreur lors du chargement des posts:', error)
        this.$toast.error('Erreur lors du chargement des posts')
        this.posts = []
      } finally {
        this.loading = false
      }
    },

    async changePage(page) {
      if (page < 1 || page > this.totalPages) return
      this.currentPage = page
      await this.loadPosts()
    },

    async createPost() {
      if (!this.isPostValid) return

      try {
        await this.$axios.post('/posts', this.newPost)
        this.$toast.success('Post créé avec succès !')
        
        this.newPost = {
          titre: '',
          contenu: '',
          categorieId: this.category.id,
          estAnonyme: false
        }
        
        this.showNewPostModal = false
        this.currentPage = 1
        await this.loadPosts()
      } catch (error) {
        console.error('Erreur lors de la création du post:', error)
        this.$toast.error('Erreur lors de la création du post')
      }
    },

    openEditModal(post) {
      this.editingPost = {
        id: post.id,
        titre: post.titre,
        contenu: post.contenu,
        categorieId: post.categorie_id,
        estAnonyme: post.est_anonyme
      }
      this.showEditModal = true
    },

    async updatePost() {
      if (!this.isEditValid) return

      try {
        await this.$axios.put(`/posts/${this.editingPost.id}`, {
          titre: this.editingPost.titre,
          contenu: this.editingPost.contenu,
          categorieId: this.editingPost.categorieId,
          estAnonyme: this.editingPost.estAnonyme
        })
        
        this.$toast.success('Post modifié avec succès !')
        this.showEditModal = false
        await this.loadPosts()
      } catch (error) {
        console.error('Erreur lors de la modification du post:', error)
        this.$toast.error('Erreur lors de la modification du post')
      }
    },

    openDeleteModal(post) {
      this.postToDelete = post
      this.showDeleteModal = true
    },

    async deletePost() {
      if (!this.postToDelete) return

      try {
        await this.$axios.delete(`/posts/${this.postToDelete.id}`)
        this.$toast.success('Post supprimé avec succès !')
        this.showDeleteModal = false
        this.postToDelete = null
        await this.loadPosts()
      } catch (error) {
        console.error('Erreur lors de la suppression du post:', error)
        this.$toast.error('Erreur lors de la suppression du post')
      }
    }
  }
}
</script>

<style scoped>
.category-page {
  min-height: 100vh;
  padding-top: 80px;
}

.category-header {
  padding: 3rem 2rem;
  margin-bottom: 2rem;
  background-color: var(--post-background);
  color: var(--text-color);
  position: relative;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

.icon-section i {
  font-size: 4rem;
  color: var(--primary-color);
  opacity: 0.9;
}

.category-title {
  font-size: 2.5rem;
  margin: 0;
  font-weight: 700;
  color: var(--text-color);
}

.category-description {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;
}

.floating-create-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background-color: var(--primary-color);
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 1000;
}

.floating-create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.posts-section {
  margin-bottom: 2rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--text-color);
}

.loading i {
  font-size: 2rem;
  margin-bottom: 1rem;
  display: block;
}

.no-posts {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-muted);
}

.no-posts i {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.posts-grid {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
}

.pagination-btn {
  background-color: var(--post-background);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  background-color: var(--primary-color);
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-color);
  font-weight: 500;
}

/* Styles des modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  background-color: var(--post-background);
  border-radius: 10px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-color);
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--background-color);
  color: var(--text-color);
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.character-counter {
  text-align: right;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.character-counter.limit-near {
  color: #f39c12;
}

.character-counter.limit-reached {
  color: #e74c3c;
  font-weight: bold;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin: 0 !important;
}

.checkbox-label input[type="checkbox"] {
  width: auto !important;
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.cancel-btn,
.submit-btn,
.delete-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancel-btn {
  background-color: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.cancel-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.submit-btn {
  background-color: var(--primary-color);
  color: white;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-btn {
  background-color: #e74c3c;
  color: white;
}

.delete-btn:hover {
  background-color: #c0392b;
}

.delete-modal .modal-body {
  text-align: center;
}

.warning-text {
  color: #e74c3c;
  font-weight: bold;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .category-header {
    padding: 2rem 1rem;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .icon-section i {
    font-size: 3rem;
  }

  .category-title {
    font-size: 2rem;
  }

  .main-content {
    padding: 0 1rem;
  }

  .floating-create-btn {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
    bottom: 1rem;
    right: 1rem;
  }

  .modal-content {
    width: 95%;
    margin: 1rem;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }

  .modal-footer {
    flex-direction: column;
  }

  .cancel-btn,
  .submit-btn,
  .delete-btn {
    width: 100%;
    justify-content: center;
  }
}
</style> 