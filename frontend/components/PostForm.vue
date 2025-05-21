<template>
    <div class="post-form">
        <div class="form-group">
            <label for="postTitle">Titre</label>
            <input type="text" id="postTitle" v-model="formData.titre" placeholder="Titre de votre post"
                maxlength="255" />
        </div>

        <div class="category-selector">
            <label for="postCategory">Catégorie :</label>
            <select id="postCategory" v-model="formData.categorieId">
                <option disabled value="">Sélectionnez une catégorie</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.nom }}
                </option>
            </select>
        </div>

        <div class="editor-toolbar">
            <div class="char-counter" :class="counterClass">
                {{ formData.contenu.length }}/{{ maxContentLength }}
            </div>
        </div>

        <textarea v-model="formData.contenu" placeholder="Que voulez-vous partager ?"
            :maxlength="maxContentLength"></textarea>

        <div class="anonymous-option">
            <input type="checkbox" id="anonymousPost" v-model="formData.estAnonyme" />
            <label for="anonymousPost">Poster anonymement</label>
        </div>

        <div v-if="error" class="error-message">
            {{ error }}
        </div>

        <button class="submit-post-btn" :disabled="!isFormValid || loading" @click="submitForm">
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <span v-else>{{ submitButtonText }}</span>
        </button>
    </div>
</template>

<script>
export default {
    name: 'PostForm',

    props: {
        initialData: {
            type: Object,
            default: () => ({
                titre: '',
                contenu: '',
                categorieId: '',
                estAnonyme: false
            })
        },
        categories: {
            type: Array,
            required: true
        },
        submitButtonText: {
            type: String,
            default: 'Publier'
        },
        loading: {
            type: Boolean,
            default: false
        }
    },

    data() {
        return {
            formData: { ...this.initialData },
            error: null,
            maxContentLength: 5000
        }
    },

    computed: {
        isFormValid() {
            return this.formData.titre.trim() &&
                this.formData.contenu.trim() &&
                this.formData.categorieId
        },

        counterClass() {
            const length = this.formData.contenu.length
            if (length > this.maxContentLength * 0.9) return 'limit-near'
            if (length >= this.maxContentLength) return 'limit-reached'
            return ''
        }
    },

    watch: {
        initialData: {
            handler(newVal) {
                this.formData = { ...newVal }
            },
            deep: true
        }
    },

    methods: {
        submitForm() {
            if (!this.isFormValid) return

            this.$emit('submit', { ...this.formData })
        },

        resetForm() {
            this.formData = {
                titre: '',
                contenu: '',
                categorieId: '',
                estAnonyme: false
            }
            this.error = null
        }
    }
}
</script>

<style scoped>
.post-form {
    width: 100%;
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

.error-message {
    color: var(--error-color);
    margin-bottom: 1rem;
    padding: 0.5rem;
    background-color: rgba(255, 68, 68, 0.1);
    border-radius: 5px;
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
</style>
