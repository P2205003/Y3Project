<template>
  <main>
    <!-- Page Header -->
    <section class="page-header">
      <h1>Our Collections</h1>
      <p>Explore consciously crafted furniture designed to bring harmony and style to your everyday living.</p>
    </section>

    <!-- Product Listing Section -->
    <section class="product-listing-section">

      <!-- Filter Controls -->
      <div class="filter-controls">
        <!-- TODO: Add v-model and @change handlers for real filtering -->
        <div class="filter-group">
          <label for="search-products">Search by Name</label>
          <input type="search" id="search-products" name="search" placeholder="e.g., Serene Sofa">
        </div>
        <div class="filter-group">
          <label for="filter-category">Category</label>
          <select id="filter-category" name="category">
            <option value="all" selected>All Categories</option>
            <option value="living-room">Living Room</option>
            <option value="dining">Dining</option>
            <option value="bedroom">Bedroom</option>
            <option value="lighting">Lighting</option>
            <option value="storage">Storage</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="filter-sort">Sort By</label>
          <select id="filter-sort" name="sort">
            <option value="featured" selected>Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
            <option value="newest">Newest</option>
          </select>
        </div>
        <!-- Action buttons removed for now, assuming auto-apply on change -->
      </div>

      <!-- Product Grid -->
      <div class="product-grid">
        <ProductCard v-for="product in products"
                     :key="product.id"
                     :product="product"
                     :linkTo="`/product-detail/${product.id}`"
              @add-to-cart="emitAddToCart"
              :apply-tilt="true"
            />
      </div>

      <!-- Pagination -->
      <!-- TODO: Implement real pagination logic -->
      <nav class="pagination-container" aria-label="Product pagination">
        <ul class="pagination">
          <li class="page-item disabled">
            <a class="page-link" href="#" tabindex="-1" aria-disabled="true">
              <span aria-hidden="true">«</span>
              <span class="visually-hidden">Previous</span>
            </a>
          </li>
          <li class="page-item active" aria-current="page"><a class="page-link" href="#">1</a></li>
          <li class="page-item"><a class="page-link" href="#">2</a></li>
          <li class="page-item"><a class="page-link" href="#">3</a></li>
          <li class="page-item"><span class="page-link">...</span></li>
          <li class="page-item"><a class="page-link" href="#">8</a></li>
          <li class="page-item">
            <a class="page-link" href="#">
              <span aria-hidden="true">»</span>
              <span class="visually-hidden">Next</span>
            </a>
          </li>
        </ul>
      </nav>

    </section>
  </main>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import ProductCard from '../components/ui/ProductCard.vue';
  import { useRoute } from 'vue-router';

  // Define emits
  const emit = defineEmits(['addToCart']);

  const products = ref([]); // Will hold all products for the current view/page
  const route = useRoute();

  // --- Placeholder Data Fetching ---
  const fetchProducts = async () => {
    console.log("Fetching products...");
    // --- TODO: Replace with actual API call using route.query for filtering/sorting/pagination ---
    console.log('Route query for filtering:', route.query); // Check query params
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay

    // Example: Return different sets based on query or just return all for now
    const allProducts = [
      { id: 'prod1', name: 'Serene Sofa', description: 'Plush comfort meets modern lines in this eco-friendly fabric sofa.', price: 1899, image: 'https://via.placeholder.com/400x250/4ECDC4/FFFFFF?text=Serene+Sofa', thumbImage: 'https://via.placeholder.com/100x100/4ECDC4/FFFFFF?text=Sofa' },
      { id: 'prod2', name: 'Aerial Chair', description: 'Lightweight yet sturdy, crafted from reclaimed teak.', price: 649, image: 'https://via.placeholder.com/400x250/FF6B6B/FFFFFF?text=Aerial+Chair', thumbImage: 'https://via.placeholder.com/100x100/FF6B6B/FFFFFF?text=Chair' },
      { id: 'prod3', name: 'Horizon Console', description: 'Sleek storage solution in FSC-certified walnut.', price: 1199, image: 'https://via.placeholder.com/400x250/FECA57/FFFFFF?text=Horizon+Console', thumbImage: 'https://via.placeholder.com/100x100/FECA57/FFFFFF?text=Console' },
      { id: 'prod4', name: 'Solstice Lamp', description: 'Warm, ambient illumination from a recycled glass base.', price: 379, image: 'https://via.placeholder.com/400x250/2F3640/FFFFFF?text=Solstice+Lamp', thumbImage: 'https://via.placeholder.com/100x100/2F3640/FFFFFF?text=Lamp' },
      { id: 'prod5', name: 'Lunar Coffee Table', description: 'Minimalist design featuring a solid oak top.', price: 899, image: 'https://via.placeholder.com/400x250/6c757d/FFFFFF?text=Lunar+Table', thumbImage: 'https://via.placeholder.com/100x100/6c757d/FFFFFF?text=Table' },
      { id: 'prod6', name: 'Oasis Bed Frame', description: 'Create a serene bedroom retreat with this bamboo frame.', price: 1450, image: 'https://via.placeholder.com/400x250/eef2f5/2F3640?text=Oasis+Bed', thumbImage: 'https://via.placeholder.com/100x100/eef2f5/2F3640?text=Bed' },
      { id: 'prod7', name: 'Terra Dining Chair', description: 'Comfortable seating crafted from solid ash wood.', price: 320, image: 'https://via.placeholder.com/400x250/ff8c61/FFFFFF?text=Terra+Chair', thumbImage: 'https://via.placeholder.com/100x100/ff8c61/FFFFFF?text=DChair' },
      { id: 'prod8', name: 'Nebula Pendant Light', description: 'Hand-blown recycled glass pendant light.', price: 450, image: 'https://via.placeholder.com/400x250/a29bfe/FFFFFF?text=Nebula+Light', thumbImage: 'https://via.placeholder.com/100x100/a29bfe/FFFFFF?text=PLight' },
    ];
    // --- End TODO ---

    products.value = allProducts; // Replace with actual fetched data
    console.log("Products loaded:", products.value);
  };

  // Fetch products when the component mounts
  onMounted(() => {
    fetchProducts();
  });

  // --- Methods ---
  const emitAddToCart = (productData) => {
    emit('addToCart', productData);
  };

  // TODO: Add methods for handling filter changes, pagination clicks,
  // which would then call fetchProducts() again with updated parameters.

</script>

<style scoped>
  /* Scoped styles if needed, most are global */
</style>
