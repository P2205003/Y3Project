<template>
    <div class="search-page">
      <div class="filter">
        <h3>Filter</h3>
        <!-- Add filter options here -->
        <div>
          <label>
            <input type="checkbox" v-model="filters.category1" /> Category 1
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" v-model="filters.category2" /> Category 2
          </label>
        </div>
      </div>
      <div class="results">
        <h3>Search Results</h3>
        <ul>
          <li v-for="item in filteredItems" :key="item.id">
            <router-link :to="{ name: 'ProductPage', params: { id: item.id } }">
              {{ item.name }} - ${{ item.price }}
            </router-link>
          </li>
        </ul>
      </div>
    </div>
</template>
  
<script>
  export default {
    name: 'SearchPage',
    data() {
      return {
        query: '',
        items: [
          { id: 1, name: 'Item 1', price: 10, category: 'category1' },
          { id: 2, name: 'Item 2', price: 20, category: 'category2' },
          { id: 3, name: 'Item 3', price: 30, category: 'category1' },
          { id: 4, name: 'Item 4', price: 40, category: 'category2' }
        ],
        filters: {
          category1: false,
          category2: false
        }
      };
    },
    computed: {
      filteredItems() {
        return this.items.filter(item => {
          return (
            (!this.filters.category1 || item.category === 'category1') &&
            (!this.filters.category2 || item.category === 'category2')
          );
        });
      }
    },
    created() {
      this.query = this.$route.query.q || '';
      // Perform search based on query
    }
  };
</script>
  
<style scoped>
  .search-page {
    display: flex;
  }
  .filter {
    width: 30%;
    padding: 20px;
    border-right: 1px solid #ccc;
  }
  .results {
    width: 70%;
    padding: 20px;
  }
</style>
  