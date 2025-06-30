<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <div class="logo">
          <i class="fas fa-honeycomb"></i>
          <span>Ruche</span>
        </div>
        <h1>Inscription</h1>
      </div>

      <form @submit.prevent="register" class="auth-form">
        <div class="form-group">
          <label for="username">Nom d'utilisateur</label>
          <input type="text" id="username" v-model="form.username" required
            placeholder="Choisissez un nom d'utilisateur" />
          <div v-if="errors.username" class="field-error">
            {{ errors.username }}
          </div>
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="form.email" required placeholder="Votre adresse email" />
          <div v-if="errors.email" class="field-error">
            {{ errors.email }}
          </div>
        </div>

        <div class="form-group">
          <label for="password">Mot de passe</label>
          <div class="password-input">
            <input :type="showPassword ? 'text' : 'password'" id="password" v-model="form.password" required
              placeholder="Créez un mot de passe" />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              <i class="fas" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
          </div>
          <div v-if="errors.password" class="field-error">
            {{ errors.password }}
          </div>
          <div class="password-requirements">
            <p>Le mot de passe doit contenir :</p>
            <ul>
              <li :class="{ valid: passwordHasMinLength }">Au moins 8 caractères</li>
              <li :class="{ valid: passwordHasUppercase }">Au moins une majuscule</li>
              <li :class="{ valid: passwordHasNumber }">Au moins un chiffre</li>
            </ul>
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirmer le mot de passe</label>
          <input :type="showPassword ? 'text' : 'password'" id="confirmPassword" v-model="form.confirmPassword" required
            placeholder="Confirmez votre mot de passe" />
          <div v-if="errors.confirmPassword" class="field-error">
            {{ errors.confirmPassword }}
          </div>
        </div>

        <div v-if="globalError" class="error-message">
          {{ globalError }}
        </div>

        <button type="submit" class="submit-btn" :disabled="loading || !isFormValid">
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <span v-else>S'inscrire</span>
        </button>
      </form>

      <div class="auth-footer">
        <p>Déjà un compte ?</p>
        <nuxt-link to="/auth/login" class="login-link">
          Se connecter
        </nuxt-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  middleware: 'register',

  data() {
    return {
      form: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      errors: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      globalError: '',
      loading: false,
      showPassword: false
    }
  },

  beforeMount() {
    // Effacer toute information d'authentification existante
    if (process.client) {
      localStorage.removeItem('auth._token.local');
      localStorage.removeItem('auth.user');
      localStorage.removeItem('auth.loggedIn');
      
      // Si d'autres éléments liés à l'authentification existent, les effacer aussi
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('auth.')) {
          localStorage.removeItem(key);
        }
      }
    }
  },

  computed: {
    passwordHasMinLength() {
      return this.form.password.length >= 8;
    },

    passwordHasUppercase() {
      return /[A-Z]/.test(this.form.password);
    },

    passwordHasNumber() {
      return /[0-9]/.test(this.form.password);
    },

    isPasswordValid() {
      return this.passwordHasMinLength && 
             this.passwordHasUppercase && 
             this.passwordHasNumber;
    },

    isFormValid() {
      return this.form.username && 
             this.form.username.trim() && 
             this.form.email && 
             this.form.email.trim() && 
             this.isPasswordValid && 
             this.form.password === this.form.confirmPassword;
    }
  },

  methods: {
    validateForm() {
      // Réinitialiser les erreurs
      this.errors = {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      };
      this.globalError = '';

      let isValid = true;

      // Validation du nom d'utilisateur
      if (!this.form.username.trim()) {
        this.errors.username = "Le nom d'utilisateur est requis";
        isValid = false;
      } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(this.form.username)) {
        this.errors.username = "Le nom d'utilisateur doit contenir entre 3 et 20 caractères (lettres, chiffres et underscore uniquement)";
        isValid = false;
      }

      // Validation de l'email
      if (!this.form.email.trim()) {
        this.errors.email = "L'email est requis";
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) {
        this.errors.email = "Format d'email invalide";
        isValid = false;
      }

      // Validation du mot de passe
      if (!this.form.password) {
        this.errors.password = "Le mot de passe est requis";
        isValid = false;
      } else if (!this.isPasswordValid) {
        this.errors.password = "Le mot de passe ne respecte pas les critères de sécurité";
        isValid = false;
      }

      // Validation de la confirmation du mot de passe
      if (this.form.password !== this.form.confirmPassword) {
        this.errors.confirmPassword = "Les mots de passe ne correspondent pas";
        isValid = false;
      }

      return isValid;
    },

    async register() {
      // Validation du formulaire
      if (!this.validateForm()) {
        return;
      }

      this.loading = true;
      this.globalError = '';

      try {
        // Utiliser notre système d'authentification personnalisé
        const response = await this.$authCustom.register(
          this.form.username,
          this.form.email,
          this.form.password
        );

        // Afficher un message de succès
          this.$toast.success(`Bienvenue ${response.user.username} ! Votre compte a été créé avec succès.`);
          
        // Redirection avec rechargement complet de la page
          setTimeout(() => {
            if (process.client) {
              window.location.href = '/';
            }
          }, 500);
      } catch (error) {
        console.error("Erreur d'inscription:", error);
        
        if (error.response && error.response.data) {
          if (error.response.data.message) {
            this.globalError = error.response.data.message;
          } else {
            this.globalError = "Erreur lors de l'inscription";
          }
        } else {
          this.globalError = "Erreur de connexion au serveur";
        }
        
        this.$toast.error(this.globalError);
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

.field-error {
  color: #ff4444;
  font-size: 0.8rem;
  margin-top: 0.3rem;
}

.password-requirements {
  margin-top: 0.8rem;
  font-size: 0.8rem;
  color: #888;
}

.password-requirements ul {
  padding-left: 1.5rem;
  margin-top: 0.3rem;
}

.password-requirements li {
  margin-bottom: 0.2rem;
}

.password-requirements li.valid {
  color: #4CAF50;
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

.auth-footer {
  text-align: center;
  color: #888;
}

.login-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: bold;
  margin-left: 0.5rem;
}

.login-link:hover {
  text-decoration: underline;
}
</style>