<template>
  <div>
    <SiteNav />
    <TopBar />
    <Ribbon />
    <SideMenu />
    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<script>
import SiteNav from './SiteNav.vue';
import TopBar from './TopBar.vue';
import Ribbon from './Ribbon.vue';
import SideMenu from './SideMenu.vue';

export default {
  name: 'MainLayout',
  components: {
    SiteNav,
    TopBar,
    Ribbon,
    SideMenu,
  },
};
</script>

<style scoped>
.content {
  padding: 40px; /* Add space below the top components */

}
</style>