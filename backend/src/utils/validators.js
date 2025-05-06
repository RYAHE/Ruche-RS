// Fonctions de validation
const validators = {
    // Valider un email
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Valider un mot de passe (au moins 8 caractères, une majuscule, un chiffre)
    isValidPassword: (password) => {
        return password.length >= 8 &&
            /[A-Z]/.test(password) &&
            /[0-9]/.test(password);
    },

    // Valider un nom d'utilisateur (3-20 caractères, lettres, chiffres, underscore)
    isValidUsername: (username) => {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    },

    // Valider le contenu d'un post ou commentaire
    isValidContent: (content) => {
        return content && content.trim().length > 0 && content.length <= 5000;
    },

    // Valider le titre d'un post
    isValidTitle: (title) => {
        return title && title.trim().length > 0 && title.length <= 255;
    }
};

module.exports = validators; 