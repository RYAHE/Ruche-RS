<template>
  <div>
    <Navbar />
    <main>
      <Nuxt />
    </main>
  </div>
</template>

<script>
import Navbar from '~/components/Navbar.vue'

export default {
  components: {
    Navbar
  },
  mounted() {
    // Ne plus gérer l'authentification ici, laisser auth-custom.js s'en occuper
    if (process.client) {
      console.log('[DEFAULT-LAYOUT] Layout monté, authentification gérée par auth-custom.js');
    }
  }
}
</script>

<style>
main {
  padding-top: 60px;
  /* Hauteur de la navbar */
  min-height: calc(100vh - 60px);
}
</style>