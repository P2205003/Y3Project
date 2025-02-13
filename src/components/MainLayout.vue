<template>
    <div>
      <SiteNav />
      <TopBar />
      <Ribbon />
      <router-view />
    </div>
</template>
  
<script>
  import SiteNav from './SiteNav.vue';
  import TopBar from './TopBar.vue';
  import Ribbon from './Ribbon.vue';
  
  export default {
    name: 'MainLayout',
    components: {
      SiteNav,
      TopBar,
      Ribbon
    }
  };
</script>
  
<style scoped>
  /* Add relevant styles here */
</style>
  