<template>
  <div class="page1">
    <h1>Welcome to Page 1</h1>
    <div class="items-container">
      <div class="item" v-for="item in items" :key="item.id">
        <img :src="item.image" alt="Item Image" />
        <h3>{{ item.title }}</h3>
      </div>
    </div>
  </div>
</template>

<script>
import placeholderImage from '../components/placeholder.jpg';

export default {
  name: 'Page1',
  data() {
    return {
      items: [
        { id: 1, title: 'Item 1', image: placeholderImage },
        { id: 2, title: 'Item 2', image: placeholderImage },
        { id: 3, title: 'Item 3', image: placeholderImage }
      ]
    };
  }
};
</script>

<style scoped>
.page1 {
  padding: 20px;
}
.items-container {
  display: flex;
  gap: 20px;
}
.item {
  text-align: center;
}
.item img {
  max-width: 100px;
  height: auto;
  display: block;
  margin: 0 auto 10px;
}
</style>