export default function ({ route }) {
  // Ce middleware ne fait rien, il laisse simplement passer la requête
  // pour permettre l'accès à la page d'inscription sans redirection
  console.log('Middleware register: Accès à la page register autorisé');
} 