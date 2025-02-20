<template>
    <div class="site-nav-bd">
      <a href="user-information.html">User Information</a>
      <div class="dropdown">
        <button>Language</button>
        <div class="dropdown-content">
          <a href="#">English</a>
          <a href="#">中文</a>
          <a href="#">日本語</a>
        </div>
      </div>
    </div>
</template>
  
<script>
  export default {
    name: 'SiteNav'
  };
</script>
  
<style scoped>
  .site-nav-bd {
    background-color: #E6E6FA;
    padding: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .site-nav-bd a {
    text-decoration: none;
    color: #333;
    margin-right: 20px;
  }
  .dropdown {
    position: relative;
    display: inline-block;
  }
  .dropdown-content {
    display: none;
    position: absolute;
    background-color: #f8f8f8;
    min-width: 160px;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    z-index: 1;
  }
  .dropdown-content a {
    color: #333;
    padding: 12px 16px;
    text-decoration: none;
    display: block;
  }
  .dropdown:hover .dropdown-content {
    display: block;
  }
</style>
  