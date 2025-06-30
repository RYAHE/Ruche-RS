<template>
  <div class="category-page">
    <div class="category-header">
      <div class="category-info">
        <i class="fas fa-lightbulb"></i>
        <h1>Idées</h1>
      </div>
      <button v-if="$authCustom.isAuthenticated()" class="new-post-btn-header" @click="showNewPostModal = true">
        <i class="fas fa-plus"></i>
        Nouvelle idée
      </button>
    </div>

    <div class="posts-container">
      <div v-if="loading" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Chargement des idées...</span>
      </div>

      <div v-else-if="posts.length === 0" class="no-posts">
        <i class="fas fa-brain"></i>
        <p>Aucune idée partagée pour le moment</p>
        <button v-if="$authCustom.isAuthenticated()" class="create-post-btn" @click="showNewPostModal = true">
          Partager la première idée
        </button>
      </div>

      <div v-else>
        <post-card v-for="post in posts" :key="post.id" :post="post" @edit="editPost" @delete="confirmDeletePost" />

        <div class="pagination">
          <button class="prev-page" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)">
            <i class="fas fa-chevron-left"></i> Précédent
          </button>

          <span class="page-info">Page {{ currentPage }} sur {{ totalPages }}</span>

          <button class="next-page" :disabled="currentPage >= totalPages" @click="changePage(currentPage + 1)">
            Suivant <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Bouton flottant pour partager une nouvelle idée -->
    <button v-if="$authCustom.isAuthenticated()" class="floating-new-post-btn" @click="showNewPostModal = true"
      title="Partager une nouvelle idée"></button>

    <!-- Modal pour créer une nouvelle idée -->
    <div v-if="showNewPostModal" class="modal" id="newPostModal">
      <div class="modal-content">
        <span class="close-modal" @click="showNewPostModal = false">&times;</span>
        <h2>Nouvelle Idée 💡</h2>

        <div class="post-editor">
          <div class="form-group">
            <label for="postTitle">Titre de votre idée</label>
            <input type="text" id="postTitle" v-model="newPost.titre" placeholder="Ex: Améliorer l'interface, Nouveau service..."
              maxlength="255" />
          </div>

          <div class="editor-toolbar">
            <div class="char-counter" :class="getCounterClass">
              {{ newPost.contenu.length }}/{{ maxContentLength }}
            </div>
          </div>

          <textarea v-model="newPost.contenu" placeholder="Décrivez votre idée en détail : objectifs, moyens de mise en œuvre, bénéfices attendus..."
            :maxlength="maxContentLength"></textarea>

          <div class="idee-options">
            <div class="anonymous-option">
              <input type="checkbox" id="anonymousPost" v-model="newPost.estAnonyme" />
              <label for="anonymousPost">Publier anonymement</label>
            </div>
            
            <div class="idee-tip">
              <i class="fas fa-rocket"></i>
              <span>🚀 Plus votre idée sera détaillée, plus elle aura de chances d'être mise en œuvre !</span>
            </div>
          </div>
        </div>

        <button class="submit-post-btn" :disabled="!isPostValid" @click="createPost">
          Partager l'idée
        </button>
      </div>
    </div>

    <!-- Modal pour éditer une idée -->
    <div v-if="showEditModal" class="modal" id="editPostModal">
      <div class="modal-content">
        <span class="close-modal" @click="showEditModal = false">&times;</span>
        <h2>Modifier l'Idée</h2>

        <div class="post-editor">
          <div class="form-group">
            <label for="editPostTitle">Titre de votre idée</label>
            <input type="text" id="editPostTitle" v-model="editingPost.titre" placeholder="Titre de votre idée"
              maxlength="255" />
          </div>

          <div class="editor-toolbar">
            <div class="char-counter" :class="getEditCounterClass">
              {{ editingPost.contenu.length }}/{{ maxContentLength }}
            </div>
          </div>

          <textarea v-model="editingPost.contenu" placeholder="Décrivez votre idée en détail..."
            :maxlength="maxContentLength"></textarea>

          <div class="anonymous-option">
            <input type="checkbox" id="editAnonymousPost" v-model="editingPost.estAnonyme" />
            <label for="editAnonymousPost">Publier anonymement</label>
          </div>
        </div>

        <button class="submit-post-btn" :disabled="!isEditValid" @click="updatePost">
          Mettre à jour
        </button>
      </div>
    </div>

    <!-- Modal de confirmation de suppression -->
    <div v-if="showDeleteModal" class="modal delete-confirmation-modal">
      <div class="modal-content">
        <span class="close-modal" @click="showDeleteModal = false">&times;</span>
        <h2>Confirmer la suppression</h2>
        <p>Êtes-vous sûr de vouloir supprimer cette idée ? Cette action est irréversible.</p>
        <button class="confirm-delete-btn" @click="deletePost">
          Supprimer définitivement
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import PostCard from '~/components/PostCard.vue'

export default {
  name: 'CategoryIdees',
  components: {
    PostCard
  },
  
  head() {
    return {
      title: 'Idées - Ruche',
      meta: [
        { hid: 'description', name: 'description', content: 'Propositions, innovations et suggestions créatives pour améliorer la communauté Ruche' }
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
      categoryId: null,
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
    await this.loadCategoryId()
    await this.loadPosts()
  },

  methods: {
    async loadCategoryId() {
      try {
        const response = await this.$axios.get('/categories')
        if (response.data.categories) {
          const ideesCategory = response.data.categories.find(cat => 
            cat.nom.toLowerCase() === 'idées' || cat.nom.toLowerCase() === 'idée' || cat.nom.toLowerCase() === 'idees'
          )
          
          if (ideesCategory) {
            this.categoryId = ideesCategory.id
            this.newPost.categorieId = ideesCategory.id
          } else {
            console.error('Catégorie "Idées" non trouvée')
            this.$toast.error('Catégorie "Idées" non trouvée')
            this.$router.push('/')
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error)
        this.$toast.error('Erreur lors du chargement de la catégorie')
        this.$router.push('/')
      }
    },

    async loadPosts() {
      if (!this.categoryId) return
      
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          limit: this.limit
        }

        const response = await this.$axios.get(`/posts/category/${this.categoryId}`, { params })
        
        if (response.data) {
          this.posts = response.data.posts || []
          this.totalPages = response.data.totalPages || 1
        }
      } catch (error) {
        console.error('Erreur lors du chargement des idées:', error)
        this.$toast.error('Erreur lors du chargement des idées')
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
        const postData = {
          titre: this.newPost.titre.trim(),
          contenu: this.newPost.contenu.trim(),
          categorieId: this.categoryId,
          estAnonyme: this.newPost.estAnonyme
        }

        await this.$authCustom.makeRequest('/posts', {
          method: 'POST',
          data: postData
        })

        this.$toast.success('Idée partagée avec succès!')
        this.showNewPostModal = false
        this.resetNewPost()
        await this.loadPosts()
      } catch (error) {
        console.error('Erreur lors du partage de l\'idée:', error)
        this.$toast.error('Erreur lors du partage de l\'idée')
      }
    },

    editPost(post) {
      this.editingPost = {
        id: post.id,
        titre: post.titre,
        contenu: post.contenu,
        categorieId: post.categorieId,
        estAnonyme: post.estAnonyme
      }
      this.showEditModal = true
    },

    async updatePost() {
      if (!this.isEditValid) return

      try {
        const postData = {
          titre: this.editingPost.titre.trim(),
          contenu: this.editingPost.contenu.trim(),
          categorieId: this.editingPost.categorieId,
          estAnonyme: this.editingPost.estAnonyme
        }

        await this.$authCustom.makeRequest(`/posts/${this.editingPost.id}`, {
          method: 'PUT',
          data: postData
        })

        this.$toast.success('Idée modifiée avec succès!')
        this.showEditModal = false
        await this.loadPosts()
      } catch (error) {
        console.error('Erreur lors de la modification de l\'idée:', error)
        this.$toast.error('Erreur lors de la modification de l\'idée')
      }
    },

    confirmDeletePost(post) {
      this.postToDelete = post
      this.showDeleteModal = true
    },

    async deletePost() {
      if (!this.postToDelete) return

      try {
        await this.$authCustom.makeRequest(`/posts/${this.postToDelete.id}`, {
          method: 'DELETE'
        })

        this.$toast.success('Idée supprimée avec succès!')
        this.showDeleteModal = false
        this.postToDelete = null
        await this.loadPosts()
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'idée:', error)
        this.$toast.error('Erreur lors de la suppression de l\'idée')
      }
    },

    resetNewPost() {
      this.newPost = {
        titre: '',
        contenu: '',
        categorieId: this.categoryId,
        estAnonyme: false
      }
    }
  }
}
</script>

<style scoped>
.category-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  border-radius: 15px;
  background-color: var(--post-background);
  color: var(--text-color);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.category-info i {
  font-size: 2.5rem;
  margin-bottom: 10px;
  color: var(--primary-color);
  opacity: 0.9;
}

.category-info h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-color);
}

.new-post-btn-header {
  background: var(--primary-color);
  border: none;
  color: white;
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.new-post-btn-header:hover {
  transform: translateY(-2px);
}

.floating-new-post-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background-color: var(--primary-color);
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1000;
}

.floating-new-post-btn::before {
  content: '+';
  font-size: 2rem;
  font-weight: bold;
}

.floating-new-post-btn:hover {
  transform: scale(1.1);
}

.posts-container {
  min-height: 400px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.loading i {
  font-size: 2rem;
  margin-bottom: 15px;
  color: var(--primary-color);
}

.no-posts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
  text-align: center;
}

.no-posts i {
  font-size: 3rem;
  margin-bottom: 20px;
  color: #ccc;
}

.create-post-btn {
  background: var(--primary-color);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 20px;
  transition: all 0.3s ease;
}

.create-post-btn:hover {
  transform: translateY(-2px);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  padding: 20px;
}

.pagination button {
  background: var(--primary-color);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.pagination button:not(:disabled):hover {
  transform: translateY(-2px);
}

.page-info {
  font-weight: 600;
  color: #333;
}

.idee-options {
  margin-top: 20px;
}

.idee-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f3e5f5;
  border: 1px solid #e1bee7;
  border-radius: 8px;
  padding: 10px;
  margin-top: 15px;
  font-size: 0.9rem;
  color: #4a148c;
}

.idee-tip i {
  color: var(--primary-color);
}

/* Styles pour les modals */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 15px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.close-modal {
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
  transition: color 0.3s ease;
}

.close-modal:hover {
  color: #333;
}

.post-editor {
  margin: 20px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.editor-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.char-counter {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.char-counter.limit-near {
  color: #f39c12;
}

.char-counter.limit-reached {
  color: #e74c3c;
}

textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s ease;
}

textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.anonymous-option {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 15px;
}

.anonymous-option input[type="checkbox"] {
  width: auto;
}

.submit-post-btn {
  background: var(--primary-color);
  border: none;
  color: white;
  padding: 12px 30px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  width: 100%;
}

.submit-post-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.submit-post-btn:not(:disabled):hover {
  transform: translateY(-2px);
}

.confirm-delete-btn {
  background: #e74c3c;
  border: none;
  color: white;
  padding: 12px 30px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  width: 100%;
}

.confirm-delete-btn:hover {
  background: #c0392b;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .category-header {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .category-info h1 {
    font-size: 1.5rem;
  }
  
  .floating-new-post-btn {
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
  }
  
  .modal-content {
    width: 95%;
    padding: 20px;
  }
}
</style> 