<template>
  <div class="post" :class="{ 'with-actions': isAuthor }">
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
    
    <h3 class="post-title">{{ post.titre }}</h3>
    
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
      
      <button class="comment-btn" @click="$router.push(`/post/${post.id}`)">
        <i class="fas fa-comment"></i>
        <span>{{ post.nombre_commentaires || 0 }}</span>
      </button>
      
      <button 
        v-if="isAuthor" 
        class="edit-post-btn"
        @click="$emit('edit', post)"
      >
        <i class="fas fa-edit"></i>
        <span>Modifier</span>
      </button>
      
      <button 
        v-if="isAuthor" 
        class="delete-post-btn"
        @click="$emit('delete', post)"
      >
        <i class="fas fa-trash"></i>
        <span>Supprimer</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    post: {
      type: Object,
      required: true
    }
  },
  
  data() {
    return {
      hasLiked: false,
      likeCount: this.post.nombre_likes || 0
    }
  },
  
  computed: {
    isAuthor() {
      if (!this.$auth.loggedIn) return false
      return this.$auth.user.id === this.post.auteur_id
    }
  },
  
  async mounted() {
    if (this.$auth.loggedIn) {
      try {
        const response = await this.$axios.get(`/posts/${this.post.id}/like/check`)
        this.hasLiked = response.data.hasLiked
      } catch (error) {
        console.error('Erreur lors de la vérification du like:', error)
      }
    }
  },
  
  methods: {
    formatDate(dateString) {
      const date = new Date(dateString)
      const now = new Date()
      const diff = now - date
      
      // Moins d'une minute
      if (diff < 60000) {
        return 'à l\'instant'
      }
      // Moins d'une heure
      if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000)
        return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`
      }
      // Moins d'un jour
      if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000)
        return `il y a ${hours} heure${hours > 1 ? 's' : ''}`
      }
      // Plus d'un jour
      const days = Math.floor(diff / 86400000)
      if (days < 7) {
        return `il y a ${days} jour${days > 1 ? 's' : ''}`
      }
      // Format date standard
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    },
    
    async toggleLike() {
      if (!this.$auth.loggedIn) {
        this.$router.push('/auth/login')
        return
      }
      
      try {
        if (this.hasLiked) {
          await this.$axios.delete(`/posts/${this.post.id}/like`)
          this.likeCount--
        } else {
          await this.$axios.post(`/posts/${this.post.id}/like`)
          this.likeCount++
        }
        this.hasLiked = !this.hasLiked
      } catch (error) {
        console.error('Erreur lors de la gestion du like:', error)
        this.$toast.error('Erreur lors de la gestion du like')
      }
    }
  }
}
</script>

<style scoped>
.post {
  background-color: var(--post-background);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  transition: transform 0.2s ease;
}

.post:hover {
  transform: translateY(-2px);
}

.post-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.post-time {
  font-size: 0.8rem;
  color: #888;
}

.post-category {
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  background-color: rgba(255, 183, 0, 0.2);
  border-radius: 10px;
  color: var(--primary-color);
}

.post-title {
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.post-content {
  margin-bottom: 1rem;
  white-space: pre-line;
}

.post-edited-info {
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 0.5rem;
  font-style: italic;
}

.post-actions {
  display: flex;
  gap: 1rem;
  color: #888;
}

.post-actions button {
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

.edit-post-btn:hover {
  color: var(--primary-color);
}

.delete-post-btn:hover {
  color: #ff4444;
}

.anonymous-author {
  font-style: italic;
}
</style> 