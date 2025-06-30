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
        <button v-if="$authCustom.isAuthenticated()" class="create-post-btn" @click="showNewPostModal = true">
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
    <button v-if="$authCustom.isAuthenticated()" class="floating-new-post-btn" @click="showNewPostModal = true"
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

          <div class="form-group">
            <label for="postCategory">Catégorie</label>
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

          <div class="form-group">
            <label for="editPostCategory">Catégorie</label>
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

  watch: {
    '$route'() {
      // Recharger les posts quand l'URL change (ex: paramètre exclude)
      this.loadPosts()
    }
  },

  methods: {
    async loadPosts() {
      this.loading = true;
      try {
        console.log("Tentative de récupération des posts...");
        
        // Récupérer le paramètre exclude depuis l'URL
        const excludeCategory = this.$route.query.exclude;
        
        let excludeCategoryId = null;
        if (excludeCategory === 'NSFW') {
          // Trouver l'ID de la catégorie NSFW
          await this.loadCategories(); // S'assurer que les catégories sont chargées
          const nsfwCategory = this.categories.find(cat => cat.nom.toUpperCase() === 'NSFW');
          if (nsfwCategory) {
            excludeCategoryId = nsfwCategory.id;
          }
        }
        
        const params = {
            page: this.currentPage,
            limit: this.limit,
            category: this.selectedCategory,
            search: this.searchQuery
        };
        
        // Ajouter le paramètre d'exclusion si nécessaire
        if (excludeCategoryId) {
          params.excludeCategory = excludeCategoryId;
          }
        
        const response = await this.$axios.$get('/posts', { params });

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

      // Fonction helper pour stocker les logs de debug
      const logDebug = (message, data = null) => {
        console.log(message, data);
        const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
        logs.push({
          timestamp: new Date().toISOString(),
          message,
          data: data ? JSON.stringify(data) : null
        });
        localStorage.setItem('debug_logs', JSON.stringify(logs.slice(-20))); // Garder seulement les 20 derniers logs
      };

      try {
        logDebug('[CREATE-POST] === DÉBUT CRÉATION POST ===');
        
        // Vérifications détaillées de l'état d'authentification
        const isAuthenticatedCustom = this.$authCustom.isAuthenticated();
        const userCustom = this.$authCustom.getUser();
        const tokenCustom = this.$authCustom.getToken();
        const tokenLocalStorage = localStorage.getItem('auth._token.local');
        
        const authState = {
          isAuthenticatedCustom,
          userCustom,
          tokenCustomExists: !!tokenCustom,
          tokenCustomPreview: tokenCustom ? tokenCustom.substring(0, 20) + '...' : 'null',
          tokenLocalStorageExists: !!tokenLocalStorage,
          tokenLocalStoragePreview: tokenLocalStorage ? tokenLocalStorage.substring(0, 20) + '...' : 'null',
          tokensMatch: tokenCustom === tokenLocalStorage
        };
        
        logDebug('[CREATE-POST] État d\'authentification détaillé:', authState);

        // Vérifier que l'utilisateur est connecté avec notre système personnalisé
        if (!isAuthenticatedCustom) {
          logDebug('[CREATE-POST] Utilisateur non authentifié selon $authCustom');
          alert('DEBUG: Utilisateur non authentifié selon $authCustom\nVoir localStorage.debug_logs pour plus de détails');
          this.$toast.error('Vous devez être connecté pour créer un post');
          
          // Désactiver temporairement la redirection pour debug
          console.log('DEBUG: Redirection désactivée pour debug. Vérifiez les logs.');
          // setTimeout(() => {
          //   window.location.href = '/auth/login';
          // }, 300);
          return;
        }
        
        logDebug('[CREATE-POST] Utilisateur authentifié, envoi de la requête...');
        
        const postData = {
          titre: this.newPost.titre,
          contenu: this.newPost.contenu.substring(0, 50) + '...',
          categorieId: this.newPost.categorieId,
          estAnonyme: this.newPost.estAnonyme
        };
        logDebug('[CREATE-POST] Données du post:', postData);
        
        // Utiliser l'axios configuré globalement plutôt qu'une instance isolée
        const response = await this.$axios.post('/posts', {
            titre: this.newPost.titre,
            contenu: this.newPost.contenu,
            categorieId: this.newPost.categorieId,
            estAnonyme: this.newPost.estAnonyme
        });

        logDebug('[CREATE-POST] ✅ Post créé avec succès:', response);
        this.$toast.success('Post créé avec succès');
        this.showNewPostModal = false;

        // Réinitialiser le formulaire
        this.newPost = {
          titre: '',
          contenu: '',
          categorieId: this.categories.length > 0 ? this.categories[0].id : null,
          estAnonyme: false
        };

        // Recharger les posts
        await this.loadPosts();
        
        logDebug('[CREATE-POST] === FIN CRÉATION POST (SUCCÈS) ===');
      } catch (error) {
        logDebug('[CREATE-POST] === ERREUR CRÉATION POST ===');
        logDebug('[CREATE-POST] Erreur lors de la création du post:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        
        // Afficher l'erreur immédiatement
        alert(`DEBUG ERREUR: ${error.response?.status || 'Unknown'} - ${error.response?.data?.message || error.message}\nVoir localStorage.debug_logs pour détails complets`);
        
        // Gestion d'erreur plus intelligente
        if (error.response && error.response.status === 401) {
          logDebug('[CREATE-POST] ❌ Erreur 401 détectée, vérification du token...');
          
          // État d'authentification après l'erreur
          const authStateAfterError = {
            isAuthenticated: this.$authCustom.isAuthenticated(),
            user: this.$authCustom.getUser(),
            token: this.$authCustom.getToken(),
            tokenLS: localStorage.getItem('auth._token.local')
          };
          logDebug('[CREATE-POST] État auth après erreur 401:', authStateAfterError);
          
          // Avant de déconnecter, vérifier si le token est vraiment invalide
          try {
            logDebug('[CREATE-POST] Tentative de vérification avec fetchUser...');
            const user = await this.$authCustom.fetchUser();
            if (user) {
              // Le token est valide, l'erreur 401 vient d'ailleurs
              logDebug('[CREATE-POST] ✅ Token valide, erreur 401 temporaire');
              this.$toast.error('Erreur temporaire. Veuillez réessayer.');
              return;
            } else {
              logDebug('[CREATE-POST] ❌ fetchUser a retourné null');
            }
          } catch (fetchError) {
            logDebug('[CREATE-POST] ❌ Erreur lors de fetchUser:', fetchError.message);
            logDebug('[CREATE-POST] Token invalide confirmé, déconnexion nécessaire');
          }
          
          // Si on arrive ici, le token est vraiment invalide
          logDebug('[CREATE-POST] Déconnexion de l\'utilisateur...');
          
          // Afficher les logs avant déconnexion
          const debugLogs = localStorage.getItem('debug_logs');
          alert('DEBUG: Session expirée. Logs sauvegardés dans localStorage.debug_logs\n\nDerniers logs:\n' + debugLogs);
          
          this.$toast.error('Votre session a expiré. Veuillez vous reconnecter.');
          
          // Désactiver temporairement la déconnexion automatique pour debug
          console.log('DEBUG: Déconnexion automatique désactivée pour debug. Vérifiez les logs dans localStorage.');
          // this.$authCustom.logout();
        } else {
          // Autres erreurs
          const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
          this.$toast.error('Erreur lors de la création du post: ' + errorMessage);
          logDebug('[CREATE-POST] Détails de l\'erreur non-401:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
        }
        
        logDebug('[CREATE-POST] === FIN CRÉATION POST (ERREUR) ===');
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
        // Vérifier que l'utilisateur est connecté
        if (!this.$authCustom.isAuthenticated()) {
          this.$toast.error('Vous devez être connecté pour modifier un post');
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 300);
          return;
        }
        
        console.log('[UPDATE-POST] Tentative de mise à jour du post...');

        // Utiliser l'axios configuré globalement
        const response = await this.$axios.put(`/posts/${this.editingPost.id}`, {
          titre: this.editingPost.titre,
          contenu: this.editingPost.contenu,
          categorieId: this.editingPost.categorieId,
          estAnonyme: this.editingPost.estAnonyme
        });

        console.log('[UPDATE-POST] Post mis à jour avec succès:', response);
        this.$toast.success('Post mis à jour avec succès');
        this.showEditModal = false;

        // Recharger les posts
        await this.loadPosts();
      } catch (error) {
        console.error('[UPDATE-POST] Erreur lors de la mise à jour du post:', error);
        
        if (error.response && error.response.status === 401) {
          console.log('[UPDATE-POST] Erreur 401 détectée, vérification du token...');
          
          // Vérifier si le token est vraiment invalide
          try {
            const user = await this.$authCustom.fetchUser();
            if (user) {
              console.log('[UPDATE-POST] Token valide, erreur 401 temporaire');
              this.$toast.error('Erreur temporaire. Veuillez réessayer.');
              return;
            }
          } catch (fetchError) {
            console.log('[UPDATE-POST] Token invalide confirmé, déconnexion nécessaire');
          }
          
          this.$toast.error('Votre session a expiré. Veuillez vous reconnecter.');
          this.$authCustom.logout();
        } else {
          const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
          this.$toast.error('Erreur lors de la mise à jour du post: ' + errorMessage);
        }
      }
    },

    confirmDeletePost(post) {
      this.postToDelete = post
      this.showDeleteModal = true
    },

    async deletePost() {
      if (!this.postToDelete) return;

      try {
        // Vérifier que l'utilisateur est connecté
        if (!this.$authCustom.isAuthenticated()) {
          this.$toast.error('Vous devez être connecté pour supprimer un post');
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 300);
          return;
        }
        
        console.log('[DELETE-POST] Tentative de suppression du post...');

        // Utiliser l'axios configuré globalement
        await this.$axios.delete(`/posts/${this.postToDelete.id}`);

        console.log('[DELETE-POST] Post supprimé avec succès');
        this.$toast.success('Post supprimé avec succès');
        this.showDeleteModal = false;
        this.postToDelete = null;

        // Recharger les posts
        await this.loadPosts();
      } catch (error) {
        console.error('[DELETE-POST] Erreur lors de la suppression du post:', error);
        
        if (error.response && error.response.status === 401) {
          console.log('[DELETE-POST] Erreur 401 détectée, vérification du token...');
          
          // Vérifier si le token est vraiment invalide
          try {
            const user = await this.$authCustom.fetchUser();
            if (user) {
              console.log('[DELETE-POST] Token valide, erreur 401 temporaire');
              this.$toast.error('Erreur temporaire. Veuillez réessayer.');
              return;
            }
          } catch (fetchError) {
            console.log('[DELETE-POST] Token invalide confirmé, déconnexion nécessaire');
          }
          
          this.$toast.error('Votre session a expiré. Veuillez vous reconnecter.');
          this.$authCustom.logout();
        } else {
          const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
          this.$toast.error('Erreur lors de la suppression du post: ' + errorMessage);
        }
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
  margin-bottom: 20px;
  color: #ccc;
}

.no-posts p {
  margin-bottom: 1.5rem;
  color: #666;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  background: var(--post-background);
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
  color: var(--text-color);
  transition: color 0.3s ease;
}

.close-modal:hover {
  color: var(--primary-color);
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
  color: var(--text-color);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  background-color: var(--background-color);
  color: var(--text-color);
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
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
  color: var(--text-muted);
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
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  background-color: var(--background-color);
  color: var(--text-color);
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
  color: var(--text-color);
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