<template>
  <div class="home-page">
    <div class="posts-container">
      <h1>Fil d'actualité</h1>

      <div v-if="loading" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Chargement des posts...</span>
      </div>

      <div v-else-if="posts.length === 0" class="no-posts">
        <i class="fas fa-comment-slash"></i>
        <p>Aucun post à afficher pour le moment</p>
        <button v-if="$auth.loggedIn" class="create-post-btn" @click="showNewPostModal = true">
          Créer le premier post
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

    <!-- Bouton pour créer un nouveau post (visible seulement si connecté) -->
    <button v-if="$auth.loggedIn" class="new-post-btn" @click="showNewPostModal = true"
      title="Créer un nouveau post"></button>

    <!-- Modal pour créer un nouveau post -->
    <div v-if="showNewPostModal" class="modal" id="newPostModal">
      <div class="modal-content">
        <span class="close-modal" @click="showNewPostModal = false">&times;</span>
        <h2>Nouveau Post</h2>

        <div class="post-editor">
          <div class="form-group">
            <label for="postTitle">Titre</label>
            <input type="text" id="postTitle" v-model="newPost.titre" placeholder="Titre de votre post"
              maxlength="255" />
          </div>

          <div class="category-selector">
            <label for="postCategory">Catégorie :</label>
            <select id="postCategory" v-model="newPost.categorieId">
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.nom }}
              </option>
            </select>
          </div>

          <div class="editor-toolbar">
            <div class="char-counter" :class="getCounterClass">
              {{ newPost.contenu.length }}/{{ maxContentLength }}
            </div>
          </div>

          <textarea v-model="newPost.contenu" placeholder="Que voulez-vous partager ?"
            :maxlength="maxContentLength"></textarea>

          <div class="anonymous-option">
            <input type="checkbox" id="anonymousPost" v-model="newPost.estAnonyme" />
            <label for="anonymousPost">Poster anonymement</label>
          </div>
        </div>

        <button class="submit-post-btn" :disabled="!isPostValid" @click="createPost">
          Publier
        </button>
      </div>
    </div>

    <!-- Modal pour éditer un post -->
    <div v-if="showEditModal" class="modal" id="editPostModal">
      <div class="modal-content">
        <span class="close-modal" @click="showEditModal = false">&times;</span>
        <h2>Modifier le Post</h2>

        <div class="post-editor">
          <div class="form-group">
            <label for="editPostTitle">Titre</label>
            <input type="text" id="editPostTitle" v-model="editingPost.titre" placeholder="Titre de votre post"
              maxlength="255" />
          </div>

          <div class="category-selector">
            <label for="editPostCategory">Catégorie :</label>
            <select id="editPostCategory" v-model="editingPost.categorieId">
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.nom }}
              </option>
            </select>
          </div>

          <div class="editor-toolbar">
            <div class="char-counter" :class="getEditCounterClass">
              {{ editingPost.contenu.length }}/{{ maxContentLength }}
            </div>
          </div>

          <textarea v-model="editingPost.contenu" placeholder="Que voulez-vous partager ?"
            :maxlength="maxContentLength"></textarea>

          <div class="anonymous-option">
            <input type="checkbox" id="editAnonymousPost" v-model="editingPost.estAnonyme" />
            <label for="editAnonymousPost">Poster anonymement</label>
          </div>

          <div class="edit-info">
            <i class="fas fa-info-circle"></i>
            <span>La modification sera visible pour tous les utilisateurs.</span>
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
        <p>Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible.</p>
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
  components: {
    PostCard
  },
  data() {
    return {
      posts: [],
      categories: [],
      loading: true,
      currentPage: 1,
      totalPages: 1,
      limit: 10,
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
        this.newPost.contenu.trim() &&
        this.newPost.categorieId
    },

    isEditValid() {
      return this.editingPost.titre.trim() &&
        this.editingPost.contenu.trim() &&
        this.editingPost.categorieId
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
    await Promise.all([
      this.loadPosts(),
      this.loadCategories()
    ])
  },

  methods: {
    async loadPosts() {
      this.loading = true;
      try {
        console.log("Tentative de récupération des posts...");
        const response = await this.$axios.$get('/posts', {
          params: {
            page: this.currentPage,
            limit: this.limit,
            category: this.selectedCategory,
            search: this.searchQuery
          }
        });

        console.log("Réponse complète:", response);

        // Vérifiez la structure de la réponse
        if (response && response.posts) {
          this.posts = response.posts;
          this.totalPages = Math.ceil(response.totalItems / this.limit) || 1;
        } else if (Array.isArray(response)) {
          // Si la réponse est directement un tableau de posts
          this.posts = response;
          this.totalPages = 1;
        } else {
          console.error("Format de réponse inattendu:", response);
          this.posts = [];
          this.totalPages = 1;
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des posts:", error);
        this.$toast.error('Impossible de charger les posts');
        this.posts = [];
      } finally {
        this.loading = false;
      }
    },

    async loadCategories() {
      try {
        const response = await this.$axios.get('/categories')
        this.categories = response.data.categories

        // Définir la catégorie par défaut pour le nouveau post
        if (this.categories.length > 0 && !this.newPost.categorieId) {
          this.newPost.categorieId = this.categories[0].id
        }
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error)
        this.$toast.error('Impossible de charger les catégories')
      }
    },

    changePage(page) {
      this.currentPage = page
      this.loadPosts()
      // Remonter en haut de la page
      window.scrollTo(0, 0)
    },

    async createPost() {
      if (!this.isPostValid) return

      try {
        const response = await this.$axios.post('/posts', {
          titre: this.newPost.titre,
          contenu: this.newPost.contenu,
          categorieId: this.newPost.categorieId,
          estAnonyme: this.newPost.estAnonyme
        })

        this.$toast.success('Post créé avec succès')
        this.showNewPostModal = false

        // Réinitialiser le formulaire
        this.newPost = {
          titre: '',
          contenu: '',
          categorieId: this.categories.length > 0 ? this.categories[0].id : null,
          estAnonyme: false
        }

        // Recharger les posts
        await this.loadPosts()
      } catch (error) {
        console.error('Erreur lors de la création du post:', error)
        this.$toast.error('Erreur lors de la création du post')
      }
    },

    editPost(post) {
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
        const response = await this.$axios.put(`/posts/${this.editingPost.id}`, {
          titre: this.editingPost.titre,
          contenu: this.editingPost.contenu,
          categorieId: this.editingPost.categorieId,
          estAnonyme: this.editingPost.estAnonyme
        })

        this.$toast.success('Post mis à jour avec succès')
        this.showEditModal = false

        // Recharger les posts
        await this.loadPosts()
      } catch (error) {
        console.error('Erreur lors de la mise à jour du post:', error)
        this.$toast.error('Erreur lors de la mise à jour du post')
      }
    },

    confirmDeletePost(post) {
      this.postToDelete = post
      this.showDeleteModal = true
    },

    async deletePost() {
      if (!this.postToDelete) return

      try {
        await this.$axios.delete(`/posts/${this.postToDelete.id}`)

        this.$toast.success('Post supprimé avec succès')
        this.showDeleteModal = false
        this.postToDelete = null

        // Recharger les posts
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
.home-page {
  padding: 2rem;
  padding-top: 5rem;
  /* Espace pour la navbar fixe */
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 2rem;
  color: var(--primary-color);
}

.loading,
.no-posts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: var(--post-background);
  border-radius: 8px;
  text-align: center;
}

.loading i,
.no-posts i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.no-posts p {
  margin-bottom: 1.5rem;
  color: #888;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
}

.pagination button {
  background-color: var(--post-background);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.pagination button:hover:not(:disabled) {
  background-color: var(--primary-color);
  color: var(--background-color);
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #888;
}

.new-post-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: var(--background-color);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.new-post-btn::before {
  content: '+';
  font-size: 2rem;
  font-weight: bold;
}

.new-post-btn:hover {
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

/* Styles pour les modals */
.modal {
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
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.close-modal {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 1.5rem;
  cursor: pointer;
  color: #888;
}

.close-modal:hover {
  color: var(--primary-color);
}

.post-editor {
  margin-top: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #888;
}

.form-group input {
  width: 100%;
  padding: 0.8rem;
  border-radius: 5px;
  border: none;
  background-color: var(--background-color);
  color: var(--text-color);
}

.category-selector {
  margin-bottom: 1rem;
}

.category-selector label {
  display: block;
  margin-bottom: 0.5rem;
  color: #888;
}

.category-selector select {
  width: 100%;
  padding: 0.8rem;
  border-radius: 5px;
  border: none;
  background-color: var(--background-color);
  color: var(--text-color);
}

.editor-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
}

.char-counter {
  font-size: 0.8rem;
  color: #888;
}

.char-counter.limit-near {
  color: orange;
}

.char-counter.limit-reached {
  color: red;
}

textarea {
  width: 100%;
  min-height: 200px;
  padding: 0.8rem;
  border-radius: 5px;
  border: none;
  background-color: var(--background-color);
  color: var(--text-color);
  resize: vertical;
  margin-bottom: 1rem;
}

.anonymous-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.submit-post-btn {
  width: 100%;
  padding: 0.8rem;
  border-radius: 20px;
  border: none;
  background-color: var(--primary-color);
  color: var(--background-color);
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-post-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.submit-post-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.edit-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #888;
}

.edit-info i {
  color: var(--primary-color);
}

.confirm-delete-btn {
  background-color: #ff4444;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  margin-top: 1rem;
}

.confirm-delete-btn:hover {
  background-color: #ff6666;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .home-page {
    padding: 1rem;
    padding-top: 4rem;
  }

  .modal-content {
    width: 95%;
    padding: 1.5rem;
  }
}
</style>