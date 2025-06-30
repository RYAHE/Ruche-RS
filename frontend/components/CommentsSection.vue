<template>
  <div class="comments-section">
    <div class="comments-header">
      <h3><i class="fas fa-comments"></i> Commentaires ({{ totalComments }})</h3>
      <button 
        v-if="!showCommentForm && $authCustom.isAuthenticated()" 
        @click="showCommentForm = true" 
        class="add-comment-btn"
      >
        <i class="fas fa-plus"></i>
        Ajouter un commentaire
      </button>
    </div>

    <!-- Formulaire d'ajout de commentaire -->
    <div v-if="showCommentForm && $authCustom.isAuthenticated()" class="comment-form">
      <div class="form-header">
        <h4>Nouveau commentaire</h4>
        <button @click="cancelNewComment" class="cancel-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <textarea 
        v-model="newComment.contenu" 
        placeholder="Écrivez votre commentaire..."
        :maxlength="maxCommentLength"
        rows="3"
        @keydown.ctrl.enter="addComment"
      ></textarea>
      
      <div class="form-footer">
        <div class="char-counter" :class="getCounterClass">
          {{ newComment.contenu.length }} / {{ maxCommentLength }}
        </div>
        <div class="form-actions">
          <label class="anonymous-option">
            <input 
              type="checkbox" 
              v-model="newComment.estAnonyme"
            />
            <span>Commenter anonymement</span>
          </label>
          <button 
            @click="addComment" 
            :disabled="!isCommentValid || submittingComment"
            class="submit-btn"
          >
            <i class="fas fa-paper-plane"></i>
            {{ submittingComment ? 'Envoi...' : 'Publier' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Message pour les utilisateurs non connectés -->
    <div v-if="!$authCustom.isAuthenticated()" class="login-prompt">
      <i class="fas fa-user-lock"></i>
      <p>Connectez-vous pour laisser un commentaire</p>
      <button @click="$router.push('/auth/login')" class="login-btn">
        Se connecter
      </button>
    </div>

    <!-- Liste des commentaires -->
    <div class="comments-list">
      <div v-if="loadingComments" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Chargement des commentaires...</span>
      </div>

      <div v-else-if="comments.length === 0" class="no-comments">
        <i class="fas fa-comment-slash"></i>
        <p>Aucun commentaire pour le moment</p>
        <p v-if="$authCustom.isAuthenticated()">Soyez le premier à commenter !</p>
      </div>

      <div v-else>
        <Comment 
          v-for="comment in comments" 
          :key="comment.id" 
          :comment="comment"
          @edit="openEditModal"
          @delete="openDeleteModal"
        />

        <!-- Bouton "Charger plus" -->
        <div v-if="hasMoreComments" class="load-more">
          <button 
            @click="loadMoreComments" 
            :disabled="loadingMoreComments"
            class="load-more-btn"
          >
            <i v-if="loadingMoreComments" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-chevron-down"></i>
            {{ loadingMoreComments ? 'Chargement...' : 'Charger plus de commentaires' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal d'édition de commentaire -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3><i class="fas fa-edit"></i> Modifier le commentaire</h3>
          <button @click="closeEditModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <textarea 
            v-model="editingComment.contenu" 
            :maxlength="maxCommentLength"
            rows="4"
          ></textarea>
          <div class="char-counter" :class="getEditCounterClass">
            {{ editingComment.contenu.length }} / {{ maxCommentLength }}
          </div>
          <label class="anonymous-option">
            <input 
              type="checkbox" 
              v-model="editingComment.estAnonyme"
            />
            <span>Commenter anonymement</span>
          </label>
        </div>

        <div class="modal-footer">
          <button @click="closeEditModal" class="cancel-btn">
            Annuler
          </button>
          <button 
            @click="updateComment" 
            :disabled="!isEditValid || updatingComment"
            class="submit-btn"
          >
            <i class="fas fa-save"></i>
            {{ updatingComment ? 'Mise à jour...' : 'Sauvegarder' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de suppression de commentaire -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <h3><i class="fas fa-exclamation-triangle"></i> Supprimer le commentaire</h3>
          <button @click="closeDeleteModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <p>Êtes-vous sûr de vouloir supprimer ce commentaire ?</p>
          <div class="comment-preview">
            "{{ commentToDelete?.contenu.substring(0, 100) }}{{ commentToDelete?.contenu.length > 100 ? '...' : '' }}"
          </div>
          <p class="warning">Cette action est irréversible.</p>
        </div>

        <div class="modal-footer">
          <button @click="closeDeleteModal" class="cancel-btn">
            Annuler
          </button>
          <button 
            @click="deleteComment" 
            :disabled="deletingComment"
            class="delete-btn"
          >
            <i class="fas fa-trash"></i>
            {{ deletingComment ? 'Suppression...' : 'Supprimer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Comment from './Comment.vue'

export default {
  name: 'CommentsSection',
  components: {
    Comment
  },
  
  props: {
    postId: {
      type: [String, Number],
      required: true
    }
  },

  data() {
    return {
      comments: [],
      totalComments: 0,
      currentPage: 1,
      hasMoreComments: false,
      loadingComments: true,
      loadingMoreComments: false,
      showCommentForm: false,
      newComment: {
        contenu: '',
        estAnonyme: false
      },
      editingComment: {
        id: null,
        contenu: '',
        estAnonyme: false
      },
      commentToDelete: null,
      showEditModal: false,
      showDeleteModal: false,
      submittingComment: false,
      updatingComment: false,
      deletingComment: false,
      maxCommentLength: 1000,
      commentsPerPage: 10
    }
  },

  computed: {
    isCommentValid() {
      return this.newComment.contenu.trim().length > 0
    },

    isEditValid() {
      return this.editingComment.contenu.trim().length > 0
    },

    getCounterClass() {
      const length = this.newComment.contenu.length
      if (length > this.maxCommentLength * 0.9) return 'limit-near'
      if (length >= this.maxCommentLength) return 'limit-reached'
      return ''
    },

    getEditCounterClass() {
      const length = this.editingComment.contenu.length
      if (length > this.maxCommentLength * 0.9) return 'limit-near'
      if (length >= this.maxCommentLength) return 'limit-reached'
      return ''
    }
  },

  async mounted() {
    await this.loadComments()
  },

  methods: {
    async loadComments() {
      this.loadingComments = true
      try {
        const response = await this.$axios.get(`/posts/${this.postId}/comments`, {
          params: {
            page: 1,
            limit: this.commentsPerPage
          }
        })

        this.comments = response.data.commentaires || []
        this.totalComments = this.comments.length
        this.hasMoreComments = this.comments.length === this.commentsPerPage
        this.currentPage = 1
      } catch (error) {
        console.error('Erreur lors du chargement des commentaires:', error)
        this.$toast.error('Erreur lors du chargement des commentaires')
      } finally {
        this.loadingComments = false
      }
    },

    async loadMoreComments() {
      this.loadingMoreComments = true
      try {
        const response = await this.$axios.get(`/posts/${this.postId}/comments`, {
          params: {
            page: this.currentPage + 1,
            limit: this.commentsPerPage
          }
        })

        const newComments = response.data.commentaires || []
        this.comments.push(...newComments)
        this.currentPage++
        this.hasMoreComments = newComments.length === this.commentsPerPage
      } catch (error) {
        console.error('Erreur lors du chargement des commentaires supplémentaires:', error)
        this.$toast.error('Erreur lors du chargement des commentaires')
      } finally {
        this.loadingMoreComments = false
      }
    },

    async addComment() {
      if (!this.isCommentValid || this.submittingComment) return

      this.submittingComment = true
      try {
        const response = await this.$authCustom.makeRequest(`/posts/${this.postId}/comments`, {
          method: 'POST',
          data: {
            contenu: this.newComment.contenu.trim(),
            estAnonyme: this.newComment.estAnonyme
          }
        })

        // Ajouter le nouveau commentaire en tête de liste
        const newComment = response.data.commentaire
        newComment.auteur = this.newComment.estAnonyme ? 'Anonyme' : this.$authCustom.getUser()?.username
        newComment.nombre_likes = 0
        
        this.comments.unshift(newComment)
        this.totalComments++
        
        this.cancelNewComment()
        this.$toast.success('Commentaire ajouté avec succès !')
        
        // Émettre un événement pour informer le parent
        this.$emit('comment-added', newComment)
      } catch (error) {
        console.error('Erreur lors de l\'ajout du commentaire:', error)
        this.$toast.error('Erreur lors de l\'ajout du commentaire')
      } finally {
        this.submittingComment = false
      }
    },

    cancelNewComment() {
      this.showCommentForm = false
      this.newComment = {
        contenu: '',
        estAnonyme: false
      }
    },

    openEditModal(comment) {
      this.editingComment = {
        id: comment.id,
        contenu: comment.contenu,
        estAnonyme: comment.est_anonyme
      }
      this.showEditModal = true
    },

    closeEditModal() {
      this.showEditModal = false
      this.editingComment = {
        id: null,
        contenu: '',
        estAnonyme: false
      }
    },

    async updateComment() {
      if (!this.isEditValid || this.updatingComment) return

      this.updatingComment = true
      try {
        await this.$authCustom.makeRequest(`/comments/${this.editingComment.id}`, {
          method: 'PUT',
          data: {
            contenu: this.editingComment.contenu.trim(),
            estAnonyme: this.editingComment.estAnonyme
          }
        })

        // Mettre à jour le commentaire dans la liste
        const index = this.comments.findIndex(c => c.id === this.editingComment.id)
        if (index !== -1) {
          this.comments[index].contenu = this.editingComment.contenu
          this.comments[index].est_anonyme = this.editingComment.estAnonyme
          this.comments[index].date_modification = new Date().toISOString()
        }

        this.closeEditModal()
        this.$toast.success('Commentaire modifié avec succès !')
      } catch (error) {
        console.error('Erreur lors de la modification du commentaire:', error)
        this.$toast.error('Erreur lors de la modification du commentaire')
      } finally {
        this.updatingComment = false
      }
    },

    openDeleteModal(comment) {
      this.commentToDelete = comment
      this.showDeleteModal = true
    },

    closeDeleteModal() {
      this.showDeleteModal = false
      this.commentToDelete = null
    },

    async deleteComment() {
      if (!this.commentToDelete || this.deletingComment) return

      this.deletingComment = true
      try {
        await this.$authCustom.makeRequest(`/comments/${this.commentToDelete.id}`, {
          method: 'DELETE'
        })

        // Retirer le commentaire de la liste
        this.comments = this.comments.filter(c => c.id !== this.commentToDelete.id)
        this.totalComments--

        this.closeDeleteModal()
        this.$toast.success('Commentaire supprimé avec succès !')
        
        // Émettre un événement pour informer le parent
        this.$emit('comment-deleted', this.commentToDelete)
      } catch (error) {
        console.error('Erreur lors de la suppression du commentaire:', error)
        this.$toast.error('Erreur lors de la suppression du commentaire')
      } finally {
        this.deletingComment = false
      }
    }
  }
}
</script>

<style scoped>
.comments-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.comments-header h3 {
  margin: 0;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-comment-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.add-comment-btn:hover {
  transform: translateY(-1px);
}

.comment-form {
  background-color: var(--post-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.form-header h4 {
  margin: 0;
  color: var(--text-color);
}

.cancel-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.cancel-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.comment-form textarea {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  background-color: var(--background-color);
  color: var(--text-color);
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.comment-form textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.char-counter {
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

.form-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.anonymous-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--text-color);
  cursor: pointer;
}

.submit-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-prompt {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  background-color: var(--post-background);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  margin-bottom: 20px;
}

.login-prompt i {
  font-size: 2rem;
  margin-bottom: 12px;
  display: block;
}

.login-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 12px;
}

.loading {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
}

.loading i {
  font-size: 1.5rem;
  margin-bottom: 8px;
  display: block;
}

.no-comments {
  text-align: center;
  padding: 32px;
  color: var(--text-muted);
}

.no-comments i {
  font-size: 3rem;
  margin-bottom: 16px;
  display: block;
  opacity: 0.5;
}

.load-more {
  text-align: center;
  margin-top: 20px;
}

.load-more-btn {
  background-color: var(--post-background);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.load-more-btn:hover {
  background-color: var(--primary-color);
  color: white;
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  max-width: 500px;
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

.modal-body textarea {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  background-color: var(--background-color);
  color: var(--text-color);
  resize: vertical;
  font-family: inherit;
}

.comment-preview {
  background-color: var(--background-color);
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
  margin: 12px 0;
  font-style: italic;
  color: var(--text-muted);
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

.delete-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.delete-btn:hover {
  background-color: #c0392b;
}

@media (max-width: 768px) {
  .comments-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .form-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .form-actions {
    justify-content: space-between;
  }

  .modal-content {
    width: 95%;
    margin: 20px;
  }
}
</style> 