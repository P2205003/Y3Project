<script>
  export default {
    name: 'SideMenu',
    props: {
      visible: {
        type: Boolean,
        required: true
      }
    },
    methods: {
      closeMenu() {
        this.$emit('close');
      }
    }
  };
</script>

<template>
  <div :class="{ 'side-menu': true, 'side-menu-hidden': !visible }">
    <button @click="closeMenu">Close</button>
    <!-- Add your menu content here -->
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </ul>
  </div>
</template>

<style>
  .side-menu {
    position: fixed;
    top: 0;
    left: 0;
    width: 250px;
    height: 100%;
    background-color: #333;
    color: white;
    padding: 20px;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5);
    transition: transform 0.3s ease-in-out;
    transform: translateX(0);
    z-index: 100; /* High z-index to ensure it appears above other elements */
  }

  .side-menu-hidden {
    transform: translateX(-100%);
  }
</style>
