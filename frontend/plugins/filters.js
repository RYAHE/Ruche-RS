import Vue from 'vue'

// Filtre pour formater les dates
Vue.filter('formatDate', function (value) {
    if (!value) return ''

    const date = new Date(value)
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

    // Moins d'une semaine
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000)
        return `il y a ${days} jour${days > 1 ? 's' : ''}`
    }

    // Format de date standard
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
})

// Filtre pour tronquer le texte
Vue.filter('truncate', function (text, length, suffix) {
    if (!text) return ''

    if (text.length <= length) {
        return text
    }

    return text.substring(0, length) + (suffix || '...')
}) 