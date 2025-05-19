<template>
  <div class="post-detail-page">
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Chargement du post...</span>
    </div>
    
    <div v-else-if="!post" class="not-found">
      <i class="fas fa-exclamation-triangle"></i>
      <h2>Post non trouvé</h2>
      <p>Le post que vous recherchez n'existe pas ou a été supprimé.</p>
      <button class="back-btn" @click="$router.push('/')">
        Retour à l'accueil
      </button>
    </div>
    
    <div v-else class="post-container">
      <div class="post-navigation">
        <button class="back-btn" @click="$router.push('/')">
          <i class="fas fa-arrow-left"></i> Retour
        </button>
      </div>
      
      <div class="post-detail">
        <div class="post-header">
          <div class="post-author">
            <i class="fas" :class="post.est_anonyme ? 'fa-mask' : 'fa-user-circle'"></i>
            <span v-if="post.est_anonyme" class="anonymous-author">Anonyme 🎭</span>
            <span v-else>{{ post.auteur }}</span>
            <span class="post-time">{{ formatDate(post.date_creation) }}</span>
          </div>
          <div class="post-category">
            <span>{{ post.categorie_nom }}</span>
          </div>
        </div>
        
        <h1 class="post-title">{{ post.titre }}</h1>
        
        <div class="post-content">{{ post.contenu }}</div>
        
        <div v-if="post.date_modification" class="post-edited-info">
          Modifié le {{ formatDate(post.date_modification) }}
        </div>
        
        <div class="post-actions">
          <button 
            class="like-btn" 
            :class="{ 'liked': hasLiked }" 
            @click="toggleLike"
          >
            <i class="fas fa-heart"></i>
            <span class="likes-count">{{ likeCount }}</span>
          </button>
          
          <div class="comments-count">
            <i class="fas fa-comment"></i>
            <span>{{ commentCount }} commentaire{{ commentCount !== 1 ? 's' : '' }}</span>
          </div>
          
          <button 
            v-if="isAuthor" 
            class="edit-post-btn"
            @click="showEditModal = true"
          >
            <i class="fas fa-edit"></i>
            <span>Modifier</span>
          </button>
          
          <button 
            v-if="isAuthor" 
            class="delete-post-btn"
            @click="showDeleteModal = true"
          >
            <i class="fas fa-trash"></i>
            <span>Supprimer</span>
          </button>
        </div>
      </div>
      
      <div class="comments-section">
        <h2>Commentaires</h2>
        
        <div v-if="$auth.loggedIn" class="comment-form">
          <textarea 
            v-model="newComment.contenu" 
            placeholder="Ajouter un commentaire..."
            maxlength="1000"
          ></textarea>
          
          <div class="comment-form-actions">
            <div class="anonymous-option">
              <input 
                type="checkbox" 
                id="anonymousComment" 
                v-model="newComment.estAnonyme"
              />
              <label for="anonymousComment">Commenter anonymement</label>
            </div>
            
            <button 
              class="submit-comment-btn" 
              :disabled="!newComment.contenu.trim()"
              @click="addComment"
            >
              Commenter
            </button>
          </div>
        </div>
        
        <div v-else class="login-to-comment">
          <p>Connectez-vous pour ajouter un commentaire</p>
          <button @click="$router.push('/auth/login')" class="login-btn">
            Se connecter
          </button>
        </div>
        
        <div v-if="loadingComments" class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Chargement des commentaires...</span>
        </div>
        
        <div v-else-if="comments.length === 0" class="no-comments">
          <i class="fas fa-comments"></i>
          <p>Aucun commentaire pour le moment</p>
          <p v-if="$auth.loggedIn">Soyez le premier à commenter !</p>
        </div>
        
        <div v-else class="comments-list">
          <div 
            v-for="comment in comments" 
            :key="comment.id" 
            class="comment"
            :class="{ 'by-author': comment.auteur_id === post.auteur_id && !post.est_anonyme && !comment.est_anonyme }"
          >
            <div class="comment-header">
              <div class="comment-author">
                <i class="fas" :class="comment.est_anonyme ? 'fa-mask' : 'fa-user-circle'"></i>
                <span v-if="comment.est_anonyme" class="anonymous-author">Anonyme 🎭</span>
                <span v-else>{{ comment.auteur }}</span>
                <span class="comment-time">{{ formatDate(comment.date_creation) }}</span>
              </div>
            </div>
            
            <div class="comment-content">{{ comment.contenu }}</div>
            
            <div v-if="comment.date_modification" class="comment-edited-info">
              Modifié le {{ formatDate(comment.date_modification) }}
            </div>
            
            <div class="comment-actions">
              <button 
                class="like-btn" 
                :class="{ 'liked': comment.has_liked }" 
                @click="toggleCommentLike(comment)"
              >
                <i class="fas fa-heart"></i>
                <span>{{ comment.nombre_likes || 0 }}</span>
              </button>
              
              <button 
                v-if="$auth.loggedIn && $auth.user.id === comment.auteur_id" 
                class="edit-comment-btn"
                @click="editComment(comment)"
              >
                <i class="fas fa-edit"></i>
              </button>
              
              <button 
                v-if="$auth.loggedIn && $auth.user.id === comment.auteur_id" 
                class="delete-comment-btn"
                @click="confirmDeleteComment(comment)"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          
          <div v-if="hasMoreComments" class="load-more">
            <button @click="loadMoreComments" class="load-more-btn">
              <i v-if="loadingMoreComments" class="fas fa-spinner fa-spin"></i>
              <span v-else>Charger plus de commentaires</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      post: null,
      comments: [],
      loading: true,
      loadingComments: true,
      loadingMoreComments: false,
      hasLiked: false,
      likeCount: 0,
      commentCount: 0,
      commentsPage: 1,
      commentsLimit: 10,
      hasMoreComments: false,
      newComment: {
        contenu: '',
        estAnonyme: false
      },
      showEditModal: false,
      showDeleteModal: false,
      editingComment: null
    }
  },
  
  computed: {
    isAuthor() {
      return this.$auth.loggedIn && this.post && this.$auth.user.id === this.post.auteur_id
    },
    
    postId() {
      return this.$route.params.id
    }
  },
  
  async mounted() {
    await this.loadPost()
    await this.loadComments()
  },
  
  methods: {
    formatDate(date) {
      return this.$options.filters.formatDate(date)
    },
    
    async loadPost() {
      try {
        this.loading = true
        const response = await this.$axios.get(`/posts/${this.postId}`)
        this.post = response.data.post
        this.likeCount = this.post.nombre_likes || 0
        this.commentCount = this.post.nombre_commentaires || 0
        
        if (this.$auth.loggedIn) {
          const likeResponse = await this.$axios.get(`/posts/${this.postId}/like`)
          this.hasLiked = likeResponse.data.hasLiked
        }
      } catch (error) {
        console.error('Erreur lors du chargement du post:', error)
        this.post = null
      } finally {
        this.loading = false
      }
    },
    
    async loadComments(reset = false) {
      try {
        if (reset) {
          this.commentsPage = 1
          this.comments = []
          this.loadingComments = true
        }
        
        const response = await this.$axios.get(`/posts/${this.postId}/comments`, {
          params: {
            page: this.commentsPage,
            limit: this.commentsLimit
          }
        })
        
        if (reset) {
          this.comments = response.data.comments
        } else {
          this.comments = [...this.comments, ...response.data.comments]
        }
        
        this.hasMoreComments = response.data.comments.length === this.commentsLimit
        this.commentCount = response.data.totalItems || this.comments.length
      } catch (error) {
        console.error('Erreur lors du chargement des commentaires:', error)
        this.$toast.error('Impossible de charger les commentaires')
      } finally {
        this.loadingComments = false
        this.loadingMoreComments = false
      }
    },
    
    async loadMoreComments() {
      if (this.loadingMoreComments) return
      
      this.loadingMoreComments = true
      this.commentsPage++
      await this.loadComments()
    },
    
    async toggleLike() {
      if (!this.$auth.loggedIn) {
        this.$router.push('/auth/login')
        return
      }
      
      try {
        if (this.hasLiked) {
          await this.$axios.delete(`/posts/${this.postId}/like`)
          this.likeCount--
        } else {
          await this.$axios.post(`/posts/${this.postId}/like`)
          this.likeCount++
        }
        
        this.hasLiked = !this.hasLiked
      } catch (error) {
        console.error('Erreur lors de la gestion du like:', error)
        this.$toast.error('Impossible de gérer le like')
      }
    },
    
    async addComment() {
      if (!this.newComment.contenu.trim()) return
      
      try {
        await this.$axios.post(`/posts/${this.postId}/comments`, {
          contenu: this.newComment.contenu,
          estAnonyme: this.newComment.estAnonyme
        })
        
        this.$toast.success('Commentaire ajouté avec succès')
        this.newComment.contenu = ''
        this.newComment.estAnonyme = false
        
        // Recharger les commentaires
        await this.loadComments(true)
        
        // Mettre à jour le compteur de commentaires
        this.commentCount++
      } catch (error) {
        console.error('Erreur lors de l\'ajout du commentaire:', error)
        this.$toast.error('Impossible d\'ajouter le commentaire')
      }
    },
    
    async toggleCommentLike(comment) {
      if (!this.$auth.loggedIn) {
        this.$router.push('/auth/login')
        return
      }
      
      try {
        if (comment.has_liked) {
          await this.$axios.delete(`/comments/${comment.id}/like`)
          comment.nombre_likes--
        } else {
          await this.$axios.post(`/comments/${comment.id}/like`)
          comment.nombre_likes++
        }
        
        comment.has_liked = !comment.has_liked
      } catch (error) {
        console.error('Erreur lors de la gestion du like du commentaire:', error)
        this.$toast.error('Impossible de gérer le like')
      }
    }
  }
}
</script>

<style scoped>
.post-detail-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.post-navigation {
  margin-bottom: 1.5rem;
}

.back-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 5px;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.post-detail {
  background-color: var(--post-background);
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.post-time {
  font-size: 0.8rem;
  color: #888;
  margin-left: 0.5rem;
}

.post-category {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  color: var(--primary-color);
}

.post-title {
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.post-content {
  margin-bottom: 1.5rem;
  white-space: pre-line;
}

.post-edited-info {
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 1rem;
  font-style: italic;
}

.post-actions {
  display: flex;
  gap: 1rem;
  color: #888;
}

.post-actions button, .comments-count {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  border-radius: 5px;
  transition: all 0.2s ease;
}

.post-actions button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.like-btn.liked {
  color: #ff4444;
}

.comments-count {
  cursor: default;
}

.comments-section {
  margin-top: 2rem;
}

.comments-section h2 {
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.comment-form {
  margin-bottom: 2rem;
}

.comment-form textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.8rem;
  border-radius: 5px;
  border: none;
  background-color: var(--post-background);
  color: var(--text-color);
  resize: vertical;
  margin-bottom: 1rem;
}

.comment-form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.anonymous-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.submit-comment-btn {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: none;
  background-color: var(--primary-color);
  color: var(--background-color);
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-comment-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.submit-comment-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-to-comment {
  text-align: center;
  padding: 1.5rem;
  background-color: var(--post-background);
  border-radius: 10px;
  margin-bottom: 2rem;
}

.login-to-comment p {
  margin-bottom: 1rem;
  color: #888;
}

.login-btn {
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  border: none;
  background-color: var(--primary-color);
  color: var(--background-color);
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment {
  background-color: var(--post-background);
  border-radius: 10px;
  padding: 1rem;
}

.comment.by-author {
  border-left: 3px solid var(--primary-color);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.comment-time {
  font-size: 0.8rem;
  color: #888;
  margin-left: 0.5rem;
}

.comment-content {
  margin-bottom: 0.5rem;
  white-space: pre-line;
}

.comment-edited-info {
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 0.5rem;
  font-style: italic;
}

.comment-actions {
  display: flex;
  gap: 0.5rem;
  color: #888;
}

.comment-actions button {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.4rem;
  border-radius: 5px;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.comment-actions button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.load-more {
  text-align: center;
  margin-top: 1.5rem;
}

.load-more-btn {
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  border: none;
  background-color: var(--post-background);
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.anonymous-author {
  font-style: italic;
}

@media (max-width: 768px) {
  .post-detail-page {
    padding: 1rem;
  }
  
  .comment-form-actions {
    flex-direction: column;
    gap: 1rem;
  }
  
  .submit-comment-btn {
    width: 100%;
  }
}
</style> 