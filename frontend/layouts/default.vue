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