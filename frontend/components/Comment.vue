<template>
  <div class="comment-card">
    <div class="comment-header">
      <div class="comment-author">
        <div class="author-info">
          <i class="fas fa-user-circle"></i>
          <span class="author-name">{{ comment.auteur }}</span>
          <span v-if="comment.est_anonyme" class="anonymous-badge">
            <i class="fas fa-user-secret"></i>
            Anonyme
          </span>
        </div>
        <div class="comment-date">
          <i class="fas fa-clock"></i>
          <span>{{ formatDate(comment.date_creation) }}</span>
          <span v-if="comment.date_modification && comment.date_modification !== comment.date_creation" class="edited">
            (modifié)
          </span>
        </div>
      </div>
      
      <div v-if="isAuthor" class="comment-actions">
        <button @click="$emit('edit', comment)" class="edit-btn" title="Modifier">
          <i class="fas fa-edit"></i>
        </button>
        <button @click="$emit('delete', comment)" class="delete-btn" title="Supprimer">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>

    <div class="comment-content">
      <p>{{ comment.contenu }}</p>
    </div>

    <div class="comment-footer">
      <button 
        v-if="$authCustom.isAuthenticated()" 
        @click="toggleLike" 
        :class="['like-btn', { 'liked': hasLiked }]"
        :disabled="likingInProgress"
      >
        <i class="fas fa-heart"></i>
        <span>{{ likeCount }}</span>
      </button>
      
      <div v-else class="like-count-display">
        <i class="fas fa-heart"></i>
        <span>{{ likeCount }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Comment',
  props: {
    comment: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      hasLiked: false,
      likeCount: 0,
      likingInProgress: false
    }
  },

  computed: {
    isAuthor() {
      return this.$authCustom.isAuthenticated() && 
             this.comment.auteur_id && 
             this.$authCustom.getUser()?.id === this.comment.auteur_id
    }
  },

  mounted() {
    this.likeCount = this.comment.nombre_likes || 0
    if (this.$authCustom.isAuthenticated()) {
      this.checkLikeStatus()
    }
  },

  methods: {
    formatDate(dateString) {
      const date = new Date(dateString)
      const now = new Date()
      const diffInMinutes = Math.floor((now - date) / (1000 * 60))

      if (diffInMinutes < 1) return 'À l\'instant'
      if (diffInMinutes < 60) return `${diffInMinutes}min`
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
      if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}j`
      
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    },

    async checkLikeStatus() {
      try {
        const response = await this.$authCustom.makeRequest(`/comments/${this.comment.id}/like/check`)
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
          await this.$authCustom.makeRequest(`/comments/${this.comment.id}/like`, {
            method: 'DELETE'
          })
          this.hasLiked = false
          this.likeCount = Math.max(0, this.likeCount - 1)
          this.$toast.success('Like retiré')
        } else {
          await this.$authCustom.makeRequest(`/comments/${this.comment.id}/like`, {
            method: 'POST'
          })
          this.hasLiked = true
          this.likeCount++
          this.$toast.success('Commentaire liké !')
        }
      } catch (error) {
        console.error('Erreur lors du like/unlike:', error)
        this.$toast.error('Erreur lors de l\'action')
      } finally {
        this.likingInProgress = false
      }
    }
  }
}
</script>

<style scoped>
.comment-card {
  background-color: var(--post-background);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.comment-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.comment-author {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-info i {
  color: var(--primary-color);
  font-size: 1.2rem;
}

.author-name {
  font-weight: 600;
  color: var(--text-color);
}

.anonymous-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: rgba(0, 0, 0, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.comment-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.edited {
  font-style: italic;
}

.comment-actions {
  display: flex;
  gap: 8px;
}

.edit-btn,
.delete-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.edit-btn:hover {
  background-color: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.delete-btn:hover {
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.comment-content {
  margin-bottom: 12px;
}

.comment-content p {
  margin: 0;
  line-height: 1.5;
  color: var(--text-color);
  word-wrap: break-word;
}

.comment-footer {
  display: flex;
  align-items: center;
  gap: 16px;
}

.like-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 20px;
  transition: all 0.3s ease;
  font-size: 0.9rem;
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

.like-count-display {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .comment-card {
    padding: 12px;
  }
  
  .comment-header {
    flex-direction: column;
    gap: 8px;
  }
  
  .comment-actions {
    align-self: flex-end;
  }
}
</style> 