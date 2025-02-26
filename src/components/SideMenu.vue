<template>
  <div>
    <!-- Overlay to detect clicks outside the menu -->
    <div
      v-if="visible"
      class="overlay"
      @click="closeMenu"
    ></div>

    <!-- Side Menu -->
    <div :class="{ 'side-menu': true, 'side-menu-hidden': !visible }">
      <!-- Side Menu Top Section -->
      <div class="side-menu-top">
        <p>Information or Title</p>
      </div>

      <!-- Menu List -->
      <ul class="menu-list">
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
    </div>

    <!-- Close Button Outside the Menu -->
    <button
      v-if="visible"
      @click="closeMenu"
      class="close-button"
    >
      X
    </button>
  </div>
</template>

<script>
export default {
  name: "SideMenu",
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
  },
  methods: {
    closeMenu() {
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
/* Overlay */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* Side Menu Top Section */
.side-menu-top {
  width: 100%;
  padding: 10px; /* Add padding for spacing */
  background-color: #e6e6fa;
  color: #333;
  text-align: center;
  box-sizing: border-box;
  border-bottom: 1px solid #ccc; /* Optional: Add a separator between top and list */
}

/* Side Menu */
.side-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 400px;
  height: 100%;
  background-color: #93a74b;
  color: white;
  padding: 0; /* Remove padding here to handle layout explicitly */
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease-in-out;
  transform: translateX(0);
  z-index: 1000;
  display: flex;
  flex-direction: column; /* Ensures content is stacked vertically */
}

/* Menu List */
.menu-list {
  list-style: none;
  margin-left: 15px;
  padding: 20px; /* Add padding to separate from the top section */
  flex: 1; /* Push the list content below the top section */
  overflow-y: auto; /* Handle overflow if the list is too long */
}

.menu-list li {
  margin-bottom: 10px;
}

/* Side Menu Hidden */
.side-menu-hidden {
  transform: translateX(-100%);
}

/* Close Button Outside the Menu */
.close-button {
  position: fixed;
  top: 10px;
  left: 405px;
  width: 40px;
  height: 40px;
  font-size: 30px;
  background-color: transparent;
  color: #ffffff;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 5px 10px;
  cursor: pointer;
  z-index: 1001;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}

.close-button:hover {
  background-color: #93a74b;
}
</style>