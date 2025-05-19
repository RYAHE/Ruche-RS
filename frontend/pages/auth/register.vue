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
          <input 
            type="text" 
            id="username" 
            v-model="form.username" 
            required
            placeholder="Choisissez un nom d'utilisateur"
          />
          <div v-if="validationErrors.username" class="field-error">
            {{ validationErrors.username }}
          </div>
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="form.email" 
            required
            placeholder="Votre adresse email"
          />
          <div v-if="validationErrors.email" class="field-error">
            {{ validationErrors.email }}
          </div>
        </div>
        
        <div class="form-group">
          <label for="password">Mot de passe</label>
          <div class="password-input">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              id="password" 
              v-model="form.password" 
              required
              placeholder="Créez un mot de passe"
            />
            <button 
              type="button" 
              class="toggle-password" 
              @click="showPassword = !showPassword"
            >
              <i class="fas" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
          </div>
          <div v-if="validationErrors.password" class="field-error">
            {{ validationErrors.password }}
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
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="form.confirmPassword" 
            required
            placeholder="Confirmez votre mot de passe"
          />
          <div v-if="validationErrors.confirmPassword" class="field-error">
            {{ validationErrors.confirmPassword }}
          </div>
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <button 
          type="submit" 
          class="submit-btn" 
          :disabled="loading || !isFormValid"
        >
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
  middleware: 'guest',
  
  data() {
    return {
      form: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      validationErrors: {},
      error: null,
      loading: false,
      showPassword: false
    }
  },
  
  computed: {
    passwordHasMinLength() {
      return this.form.password.length >= 8
    },
    
    passwordHasUppercase() {
      return /[A-Z]/.test(this.form.password)
    },
    
    passwordHasNumber() {
      return /[0-9]/.test(this.form.password)
    },
    
    isPasswordValid() {
      return this.passwordHasMinLength && 
             this.passwordHasUppercase && 
             this.passwordHasNumber
    },
    
    isFormValid() {
      return this.form.username.trim() && 
             this.form.email.trim() && 
             this.isPasswordValid && 
             this.form.password === this.form.confirmPassword
    }
  },
  
  methods: {
    validateForm() {
      this.validationErrors = {}
      
      if (!this.form.username.trim()) {
        this.validationErrors.username = "Le nom d'utilisateur est requis"
      } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(this.form.username)) {
        this.validationErrors.username = "Le nom d'utilisateur doit contenir entre 3 et 20 caractères (lettres, chiffres et underscore uniquement)"
      }
      
      if (!this.form.email.trim()) {
        this.validationErrors.email = "L'email est requis"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) {
        this.validationErrors.email = "Format d'email invalide"
      }
      
      if (!this.form.password) {
        this.validationErrors.password = "Le mot de passe est requis"
      } else if (!this.isPasswordValid) {
        this.validationErrors.password = "Le mot de passe ne respecte pas les critères de sécurité"
      }
      
      if (this.form.password !== this.form.confirmPassword) {
        this.validationErrors.confirmPassword = "Les mots de passe ne correspondent pas"
      }
      
      return Object.keys(this.validationErrors).length === 0
    },
    
    async register() {
      if (!this.validateForm()) return
      
      this.error = null
      this.loading = true
      
      try {
        const response = await this.$axios.post('/auth/register', {
          username: this.form.username,
          email: this.form.email,
          password: this.form.password
        })
        
        // Connexion automatique après inscription
        await this.$auth.setUserToken(response.data.token)
        
        this.$toast.success('Inscription réussie ! Bienvenue sur Ruche.')
        this.$router.push('/')
      } catch (error) {
        console.error('Erreur d\'inscription:', error)
        
        if (error.response && error.response.data && error.response.data.message) {
          this.error = error.response.data.message
        } else {
          this.error = 'Erreur lors de l\'inscription. Veuillez réessayer.'
        }
      } finally {
        this.loading = false
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