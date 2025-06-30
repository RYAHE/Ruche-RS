<template>
  <div class="post-page">
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Chargement du post...</span>
    </div>

    <div v-else-if="!post" class="error">
      <i class="fas fa-exclamation-triangle"></i>
      <h2>Post non trouvé</h2>
      <p>Ce post n'existe pas ou a été supprimé.</p>
      <button @click="$router.push('/')" class="back-btn">
        <i class="fas fa-arrow-left"></i>
        Retour à l'accueil
      </button>
    </div>

    <div v-else class="post-detail">
      <!-- Bouton retour -->
      <div class="back-navigation">
        <button @click="$router.back()" class="back-btn">
          <i class="fas fa-arrow-left"></i>
          Retour
        </button>
        <div class="post-actions" v-if="isAuthor">
          <button @click="editPost" class="edit-btn">
            <i class="fas fa-edit"></i>
            Modifier
          </button>
          <button @click="confirmDelete" class="delete-btn">
            <i class="fas fa-trash"></i>
            Supprimer
          </button>
        </div>
      </div>

      <!-- Post principal -->
      <div class="post-card">
        <div class="post-header">
          <div class="post-author">
            <i class="fas" :class="post.est_anonyme ? 'fa-mask' : 'fa-user-circle'"></i>
            <div class="author-info">
              <span class="author-name">
                {{ post.est_anonyme ? 'Anonyme' : post.auteur }}
                <span v-if="post.est_anonyme" class="anonymous-badge">🎭</span>
              </span>
              <span class="post-date">{{ formatDate(post.date_creation) }}</span>
            </div>
          </div>
          <div class="post-category">
            <i class="fas fa-tag"></i>
            <span>{{ post.categorie_nom }}</span>
          </div>
        </div>

        <h1 class="post-title">{{ post.titre }}</h1>

        <div class="post-content">
          <p>{{ post.contenu }}</p>
        </div>

        <div v-if="post.date_modification && post.date_modification !== post.date_creation" class="post-edited">
          <i class="fas fa-edit"></i>
          Modifié le {{ formatDate(post.date_modification) }}
        </div>

        <div class="post-stats">
          <button 
            v-if="$authCustom.isAuthenticated()" 
            @click="toggleLike" 
            :class="['like-btn', { 'liked': hasLiked }]"
            :disabled="likingInProgress"
          >
            <i class="fas fa-heart"></i>
            <span>{{ likeCount }}</span>
          </button>
          
          <div v-else class="like-display">
            <i class="fas fa-heart"></i>
            <span>{{ likeCount }}</span>
          </div>

          <div class="comment-count">
            <i class="fas fa-comment"></i>
            <span>{{ totalComments }} commentaire{{ totalComments !== 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>

      <!-- Section des commentaires -->
      <CommentsSection 
        :post-id="postId" 
        @comment-added="onCommentAdded"
        @comment-deleted="onCommentDeleted"
      />
    </div>

    <!-- Modal d'édition -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3><i class="fas fa-edit"></i> Modifier le post</h3>
          <button @click="closeEditModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="editTitle">Titre</label>
            <input 
              id="editTitle"
              v-model="editingPost.titre" 
              type="text" 
              required
            />
          </div>

          <div class="form-group">
            <label for="editContent">Contenu</label>
            <textarea 
              id="editContent"
              v-model="editingPost.contenu" 
              rows="6"
              :maxlength="maxContentLength"
              required
            ></textarea>
            <div class="char-counter" :class="getEditCounterClass">
              {{ editingPost.contenu.length }} / {{ maxContentLength }}
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="editingPost.estAnonyme"
              />
              <span>Publier anonymement</span>
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeEditModal" class="cancel-btn">
            Annuler
          </button>
          <button 
            @click="updatePost" 
            :disabled="!isEditValid || updatingPost"
            class="submit-btn"
          >
            <i class="fas fa-save"></i>
            {{ updatingPost ? 'Mise à jour...' : 'Sauvegarder' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de suppression -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <h3><i class="fas fa-exclamation-triangle"></i> Supprimer le post</h3>
          <button @click="closeDeleteModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <p>Êtes-vous sûr de vouloir supprimer ce post ?</p>
          <div class="post-preview">
            <strong>{{ post.titre }}</strong>
          </div>
          <p class="warning">Cette action est irréversible et supprimera également tous les commentaires associés.</p>
        </div>

        <div class="modal-footer">
          <button @click="closeDeleteModal" class="cancel-btn">
            Annuler
          </button>
          <button 
            @click="deletePost" 
            :disabled="deletingPost"
            class="delete-btn"
          >
            <i class="fas fa-trash"></i>
            {{ deletingPost ? 'Suppression...' : 'Supprimer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CommentsSection from '~/components/CommentsSection.vue'

export default {
  name: 'PostDetail',
  components: {
    CommentsSection
  },
  
  head() {
    return {
      title: this.post ? `${this.post.titre} - Ruche` : 'Post - Ruche',
      meta: [
        { hid: 'description', name: 'description', content: this.post ? this.post.contenu.substring(0, 160) : 'Post sur Ruche' }
      ]
    }
  },

  data() {
    return {
      post: null,
      loading: true,
      hasLiked: false,
      likeCount: 0,
      totalComments: 0,
      likingInProgress: false,
      showEditModal: false,
      showDeleteModal: false,
      updatingPost: false,
      deletingPost: false,
      editingPost: {
        titre: '',
        contenu: '',
        estAnonyme: false
      },
      maxContentLength: 5000
    }
  },

  computed: {
    postId() {
      return this.$route.params.id
    },

    isAuthor() {
      return this.$authCustom.isAuthenticated() && 
             this.post && 
             this.post.auteur_id && 
             this.$authCustom.getUser()?.id === this.post.auteur_id
    },

    isEditValid() {
      return this.editingPost.titre.trim() && this.editingPost.contenu.trim()
    },

    getEditCounterClass() {
      const length = this.editingPost.contenu.length
      if (length > this.maxContentLength * 0.9) return 'limit-near'
      if (length >= this.maxContentLength) return 'limit-reached'
      return ''
    }
  },

  async mounted() {
    await this.loadPost()
  },

  methods: {
    async loadPost() {
      this.loading = true
      try {
        const response = await this.$axios.get(`/posts/${this.postId}`)
        this.post = response.data.post
        this.likeCount = this.post.nombre_likes || 0
        this.totalComments = this.post.nombre_commentaires || 0

        if (this.$authCustom.isAuthenticated()) {
          await this.checkLikeStatus()
        }
      } catch (error) {
        console.error('Erreur lors du chargement du post:', error)
        if (error.response?.status === 404) {
          this.post = null
        } else {
          this.$toast.error('Erreur lors du chargement du post')
        }
      } finally {
        this.loading = false
      }
    },

    async checkLikeStatus() {
      try {
        const response = await this.$authCustom.makeRequest(`/posts/${this.postId}/like/check`)
        this.hasLiked = response.data.hasLiked
      } catch (error) {
        console.error('Erreur lors de la vérification du like:', error)
      }
    },

    async toggleLike() {
      if (this.likingInProgress) return
      
      this.likingInProgress = true
      try {
        if (this.hasLiked) {
          await this.$authCustom.makeRequest(`/posts/${this.postId}/like`, {
            method: 'DELETE'
          })
          this.hasLiked = false
          this.likeCount = Math.max(0, this.likeCount - 1)
        } else {
          await this.$authCustom.makeRequest(`/posts/${this.postId}/like`, {
            method: 'POST'
          })
          this.hasLiked = true
          this.likeCount++
        }
      } catch (error) {
        console.error('Erreur lors du like/unlike:', error)
        this.$toast.error('Erreur lors de l\'action')
      } finally {
        this.likingInProgress = false
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    editPost() {
      this.editingPost = {
        titre: this.post.titre,
        contenu: this.post.contenu,
        estAnonyme: this.post.est_anonyme
      }
      this.showEditModal = true
    },

    closeEditModal() {
      this.showEditModal = false
      this.editingPost = {
        titre: '',
        contenu: '',
        estAnonyme: false
      }
    },

    async updatePost() {
      if (!this.isEditValid || this.updatingPost) return

      this.updatingPost = true
      try {
        const response = await this.$authCustom.makeRequest(`/posts/${this.postId}`, {
          method: 'PUT',
          data: {
            titre: this.editingPost.titre.trim(),
            contenu: this.editingPost.contenu.trim(),
            categorieId: this.post.categorie_id,
            estAnonyme: this.editingPost.estAnonyme
          }
        })

        // Mettre à jour les données locales
        this.post.titre = this.editingPost.titre
        this.post.contenu = this.editingPost.contenu
        this.post.est_anonyme = this.editingPost.estAnonyme
        this.post.date_modification = new Date().toISOString()

        this.closeEditModal()
        this.$toast.success('Post modifié avec succès !')
      } catch (error) {
        console.error('Erreur lors de la modification du post:', error)
        this.$toast.error('Erreur lors de la modification du post')
      } finally {
        this.updatingPost = false
      }
    },

    confirmDelete() {
      this.showDeleteModal = true
    },

    closeDeleteModal() {
      this.showDeleteModal = false
    },

    async deletePost() {
      if (this.deletingPost) return

      this.deletingPost = true
      try {
        await this.$authCustom.makeRequest(`/posts/${this.postId}`, {
          method: 'DELETE'
        })

        this.$toast.success('Post supprimé avec succès !')
        this.$router.push('/')
      } catch (error) {
        console.error('Erreur lors de la suppression du post:', error)
        this.$toast.error('Erreur lors de la suppression du post')
      } finally {
        this.deletingPost = false
      }
    },

    onCommentAdded(comment) {
      this.totalComments++
    },

    onCommentDeleted(comment) {
      this.totalComments = Math.max(0, this.totalComments - 1)
    }
  }
}
</script>

<style scoped>
.post-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

.loading,
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--text-color);
}

.loading i,
.error i {
  font-size: 3rem;
  margin-bottom: 20px;
  color: var(--primary-color);
}

.error h2 {
  margin-bottom: 12px;
  color: var(--text-color);
}

.back-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.post-actions {
  display: flex;
  gap: 12px;
}

.edit-btn,
.delete-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.edit-btn {
  background-color: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.edit-btn:hover {
  background-color: #3498db;
  color: white;
}

.delete-btn {
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.delete-btn:hover {
  background-color: #e74c3c;
  color: white;
}

.post-card {
  background-color: var(--post-background);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.post-author i {
  font-size: 2rem;
  color: var(--primary-color);
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.author-name {
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 6px;
}

.anonymous-badge {
  font-size: 0.9rem;
}

.post-date {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.post-category {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: rgba(52, 152, 219, 0.1);
  color: var(--primary-color);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.post-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--text-color);
  line-height: 1.3;
}

.post-content {
  margin-bottom: 20px;
}

.post-content p {
  line-height: 1.6;
  color: var(--text-color);
  white-space: pre-line;
  margin: 0;
}

.post-edited {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
  margin-bottom: 16px;
}

.post-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 20px;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.like-btn:hover {
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.like-btn.liked {
  color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.1);
}

.like-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.like-display,
.comment-count {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 1rem;
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
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.2rem;
  padding: 4px;
  border-radius: 4px;
}

.close-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-color);
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
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

.char-counter {
  text-align: right;
  margin-top: 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.char-counter.limit-near {
  color: #f39c12;
}

.char-counter.limit-reached {
  color: #e74c3c;
  font-weight: bold;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  margin: 0 !important;
}

.checkbox-label input[type="checkbox"] {
  width: auto !important;
  margin: 0;
}

.post-preview {
  background-color: var(--background-color);
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
  margin: 12px 0;
  font-weight: bold;
}

.warning {
  color: #e74c3c;
  font-weight: bold;
  margin-top: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

.cancel-btn,
.submit-btn,
.delete-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cancel-btn {
  background-color: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.cancel-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.submit-btn {
  background-color: var(--primary-color);
  color: white;
}

.submit-btn:disabled {
  opacity: 0.6;
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

@media (max-width: 768px) {
  .post-page {
    padding: 12px;
  }

  .back-navigation {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .post-actions {
    justify-content: center;
  }

  .post-card {
    padding: 16px;
  }

  .post-header {
    flex-direction: column;
    gap: 12px;
  }

  .post-title {
    font-size: 1.5rem;
  }

  .post-stats {
    justify-content: center;
  }

  .modal-content {
    width: 95%;
    margin: 20px;
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