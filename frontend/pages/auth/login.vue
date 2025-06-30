<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <div class="logo">
          <i class="fas fa-honeycomb"></i>
          <span>Ruche</span>
        </div>
        <h1>Connexion</h1>
      </div>

      <form @submit.prevent="login" class="auth-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="form.email" required placeholder="Votre adresse email" />
        </div>

        <div class="form-group">
          <label for="password">Mot de passe</label>
          <div class="password-input">
            <input :type="showPassword ? 'text' : 'password'" id="password" v-model="form.password" required
              placeholder="Votre mot de passe" />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              <i class="fas" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <span v-else>Se connecter</span>
        </button>
        
        <!-- Bouton de nettoyage pour le débogage -->
        <button type="button" class="debug-btn" @click="cleanupAuth" title="Nettoyer toutes les données d'authentification">
          <i class="fas fa-broom"></i>
          Nettoyer l'authentification
        </button>
      </form>

      <div class="auth-footer">
        <p>Pas encore de compte ?</p>
        <nuxt-link to="/auth/register" class="register-link">
          Créer un compte
        </nuxt-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  middleware: 'guest',

  data() {
    return {
      form: {
        email: '',
        password: ''
      },
      error: null,
      loading: false,
      showPassword: false
    }
  },

  beforeMount() {
    // Effacer toute information d'authentification existante
    if (process.client) {
      console.log('[LOGIN] Nettoyage préventif de l\'authentification...');
      this.cleanupAuth();
    }
  },

  methods: {
    cleanupAuth() {
      if (process.client) {
        // Utiliser notre méthode de nettoyage complet
        if (this.$authCustom && this.$authCustom.fullCleanup) {
          this.$authCustom.fullCleanup();
        } else {
          // Nettoyage manuel si le plugin n'est pas encore chargé
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
              key.startsWith('auth.') || 
              key === 'auth' || 
              key.includes('token') ||
              key.includes('user')
            )) {
              keysToRemove.push(key);
            }
          }
          
          keysToRemove.forEach(key => {
            console.log('[LOGIN] Suppression de la clé:', key);
            localStorage.removeItem(key);
          });
        }
        
        console.log('[LOGIN] Nettoyage terminé');
      }
    },

    async login() {
      // Vérification des champs
      if (!this.form.email || !this.form.password) {
        this.error = 'Veuillez remplir tous les champs';
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        console.log('[LOGIN] Tentative de connexion pour:', this.form.email);

        // Utiliser notre système d'authentification personnalisé
        const response = await this.$authCustom.login(
          this.form.email,
          this.form.password
        );

        console.log('[LOGIN] Réponse de connexion:', response);
        
        // Vérifier l'état d'authentification après connexion
        const isAuth = this.$authCustom.isAuthenticated();
        const user = this.$authCustom.getUser();
        const token = this.$authCustom.getToken();
        
        console.log('[LOGIN] État après connexion:', {
          isAuthenticated: isAuth,
          user: user,
          hasToken: !!token
        });
        
        if (isAuth && user) {
          // Afficher un message de succès
          this.$toast.success(`Connexion réussie ! Bienvenue ${user.username}`);
          
          // Attendre un peu pour que l'utilisateur voie le message
          setTimeout(() => {
            console.log('[LOGIN] Redirection vers la page d\'accueil...');
            // Utiliser $router.push au lieu de window.location.href pour éviter un rechargement complet
            this.$router.push('/');
          }, 1000);
        } else {
          console.error('[LOGIN] Connexion échouée: état d\'authentification invalide');
          this.error = 'Erreur lors de la connexion : état invalide';
          this.$toast.error(this.error);
        }
      } catch (error) {
        console.error("[LOGIN] Erreur de connexion:", error);
        
        if (error.response && error.response.data && error.response.data.message) {
          this.error = error.response.data.message;
        } else {
          this.error = 'Erreur lors de la connexion. Veuillez réessayer.';
        }
        
        this.$toast.error(this.error);
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background-color: var(--background-color);
}

.auth-container {
  width: 100%;
  max-width: 400px;
  background-color: var(--post-background);
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.8rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.auth-header h1 {
  font-size: 1.5rem;
  color: var(--text-color);
}

.auth-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
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
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: var(--background-color);
  color: var(--text-color);
}

.password-input {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
}

.error-message {
  color: #ff4444;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.submit-btn {
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

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.debug-btn {
  width: 100%;
  padding: 0.6rem;
  border-radius: 15px;
  border: 1px solid #ff6b6b;
  background-color: transparent;
  color: #ff6b6b;
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.debug-btn:hover {
  background-color: #ff6b6b;
  color: white;
  transform: translateY(-1px);
}

.auth-footer {
  text-align: center;
  color: #888;
}

.register-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: bold;
  margin-left: 0.5rem;
}

.register-link:hover {
  text-decoration: underline;
}
</style>