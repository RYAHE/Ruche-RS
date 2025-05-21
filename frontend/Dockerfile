FROM node:16-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers
COPY . .

# Exposer le port
EXPOSE 3000

# Nettoyer le cache
RUN npm cache clean --force

# Commande de démarrage en mode développement
CMD ["npm", "run", "dev"] 