<template>
  <div class="admin-products">
    <div class="admin-page-header">
      <h1>Product Management</h1>
      <router-link to="/admin/products/add" class="add-product-btn">
        Add New Product
      </router-link>
    </div>

    <!-- Search and filters -->
    <div class="admin-panel">
      <div class="search-filters">
        <div class="search-box">
          <input type="text"
                 v-model="searchQuery"
                 placeholder="Search products..."
                 @input="debounceSearch" />
        </div>
        <div class="filters">
          <select v-model="categoryFilter" @change="filterProducts">
            <option value="">All Categories</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
          <select v-model="statusFilter" @change="filterProducts">
            <option value="">All Status</option>
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Products table -->
    <div class="admin-panel">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading products...</p>
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
        <button @click="fetchProducts" class="retry-btn">Try Again</button>
      </div>

      <table v-else-if="filteredProducts.length > 0" class="data-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Category</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in filteredProducts" :key="product._id">
            <td class="image-cell">
              <img :src="product.images && product.images.length ? product.images[0] : placeholderImage"
                   :alt="product.name" />
            </td>
            <td>{{ product.name }}</td>
            <td>${{ product.price.toFixed(2) }}</td>
            <td>{{ product.category || 'N/A' }}</td>
            <td>
              <span :class="['status-badge', product.enabled ? 'status-active' : 'status-inactive']">
                {{ product.enabled ? 'Enabled' : 'Disabled' }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="action-btn view-btn" @click="viewProduct(product)">
                View
              </button>
              <button class="action-btn edit-btn" @click="editProduct(product)">
                Edit
              </button>
              <button class="action-btn"
                      :class="product.enabled ? 'disable-btn' : 'enable-btn'"
                      @click="toggleProductStatus(product)">
                {{ product.enabled ? 'Disable' : 'Enable' }}
              </button>
              <button class="action-btn delete-btn" @click="deleteProduct(product)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty-state">
        <p>No products found.</p>
        <p v-if="searchQuery || categoryFilter || statusFilter !== ''">Try adjusting your search or filters.</p>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button :disabled="currentPage === 1"
                @click="changePage(currentPage - 1)"
                class="page-btn">
          Previous
        </button>
        <div class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </div>
        <button :disabled="currentPage === totalPages"
                @click="changePage(currentPage + 1)"
                class="page-btn">
          Next
        </button>
      </div>
    </div>

    <!-- Product edit modal -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h2>{{ isNewProduct ? 'Add Product' : 'Edit Product' }}</h2>
          <button class="close-modal-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveProduct">
            <!-- Form fields would go here -->
            <div class="form-group">
              <label for="productName">Product Name</label>
              <input type="text"
                     id="productName"
                     v-model="editingProduct.name"
                     required />
            </div>

            <div class="form-group">
              <label for="productPrice">Price ($)</label>
              <input type="number"
                     id="productPrice"
                     v-model="editingProduct.price"
                     step="0.01"
                     min="0"
                     required />
            </div>

            <div class="form-group">
              <label for="productCategory">Category</label>
              <input type="text"
                     id="productCategory"
                     v-model="editingProduct.category" />
            </div>

            <div class="form-group">
              <label for="productDescription">Description</label>
              <textarea id="productDescription"
                        v-model="editingProduct.description"
                        rows="4"></textarea>
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="closeModal">Cancel</button>
              <button type="submit" class="save-btn">Save Product</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminProducts',
  data() {
    return {
      products: [],
      filteredProducts: [],
      loading: true,
      error: null,
      searchQuery: '',
      categoryFilter: '',
      statusFilter: '',
      categories: [],
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      totalPages: 0,
      searchTimeout: null,
      showEditModal: false,
      isNewProduct: false,
      editingProduct: {
        name: '',
        price: 0,
        category: '',
        description: '',
        enabled: true
      },
      originalProduct: null,
      placeholderImage: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1a3f85814e0%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1a3f85814e0%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2274.5%22%20y%3D%22104.8%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E'
    };
  },
  created() {
    this.fetchProducts();
  },
  methods: {
    async fetchProducts() {
      this.loading = true;
      this.error = null;

      try {
        const response = await fetch('/api/products/admin', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        this.products = await response.json();

        // Extract unique categories
        const categorySet = new Set();
        this.products.forEach(product => {
          if (product.category) {
            categorySet.add(product.category);
          }
        });
        this.categories = Array.from(categorySet).sort();

        this.filterProducts();
      } catch (error) {
        console.error('Error fetching products:', error);
        this.error = 'Failed to load products. Please try again.';
      } finally {
        this.loading = false;
      }
    },

    filterProducts() {
      // Apply filters
      let filtered = [...this.products];

      // Apply search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(product =>
          product.name.toLowerCase().includes(query) ||
          (product.description && product.description.toLowerCase().includes(query))
        );
      }

      // Apply category filter
      if (this.categoryFilter) {
        filtered = filtered.filter(product =>
          product.category === this.categoryFilter
        );
      }

      // Apply status filter
      if (this.statusFilter !== '') {
        const enabled = this.statusFilter === 'true';
        filtered = filtered.filter(product => product.enabled === enabled);
      }

      // Update pagination
      this.totalItems = filtered.length;
      this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
      this.currentPage = 1; // Reset to first page when filters change

      // Apply pagination
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      this.filteredProducts = filtered.slice(start, end);
    },

    debounceSearch() {
      // Debounce search to avoid too many filter operations
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.filterProducts();
      }, 300);
    },

    changePage(page) {
      this.currentPage = page;
      // Apply pagination
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      this.filteredProducts = this.products.slice(start, end);
    },

    viewProduct(product) {
      // Navigate to product detail page in the main shop (for viewing)
      window.open(`/product/${product._id}`, '_blank');
    },

    editProduct(product) {
      this.isNewProduct = false;
      this.originalProduct = product;
      this.editingProduct = { ...product };
      this.showEditModal = true;
    },

    closeModal() {
      this.showEditModal = false;
      this.editingProduct = {
        name: '',
        price: 0,
        category: '',
        description: '',
        enabled: true
      };
    },

    async saveProduct() {
      // Save product logic would go here
      // This is just a placeholder
      console.log('Saving product:', this.editingProduct);
      this.closeModal();
    },

    async toggleProductStatus(product) {
      try {
        const response = await fetch(`/api/products/${product._id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ enabled: !product.enabled })
        });

        if (!response.ok) {
          throw new Error('Failed to update product status');
        }

        // Update product in local array
        product.enabled = !product.enabled;

        // Show success message
        alert(`Product ${product.enabled ? 'enabled' : 'disabled'} successfully`);
      } catch (error) {
        console.error('Error toggling product status:', error);
        alert('Error updating product status');
      }
    },

    async deleteProduct(product) {
      if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
        return;
      }

      try {
        const response = await fetch(`/api/products/${product._id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to delete product');
        }

        // Remove product from arrays
        this.products = this.products.filter(p => p._id !== product._id);
        this.filterProducts(); // Re-apply filters

        // Show success message
        alert('Product deleted successfully');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product');
      }
    }
  }
};
</script>

<style scoped>
  .admin-products {
    width: 100%;
  }

  .admin-page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

    .admin-page-header h1 {
      margin: 0;
      font-size: 1.8rem;
      color: #333;
    }

  .add-product-btn {
    background-color: #5D5CDE;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    text-decoration: none;
    font-weight: 500;
    transition: background-color 0.2s;
  }

    .add-product-btn:hover {
      background-color: #4a49b8;
    }

  .admin-panel {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    margin-bottom: 1.5rem;
    padding: 1.5rem;
  }

  .search-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .search-box {
    flex: 1;
    min-width: 250px;
  }

    .search-box input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

  .filters {
    display: flex;
    gap: 1rem;
  }

    .filters select {
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      min-width: 150px;
    }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

    .data-table th,
    .data-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .data-table th {
      font-weight: 600;
      color: #333;
    }

  .image-cell {
    width: 80px;
  }

    .image-cell img {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
    }

  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .status-active {
    background-color: #e8f5e9;
    color: #388e3c;
  }

  .status-inactive {
    background-color: #ffebee;
    color: #d32f2f;
  }

  .actions-cell {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.4rem 0.6rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .view-btn {
    background-color: #e3f2fd;
    color: #1976d2;
  }

  .edit-btn {
    background-color: #e8f5e9;
    color: #388e3c;
  }

  .enable-btn {
    background-color: #e8f5e9;
    color: #388e3c;
  }

  .disable-btn {
    background-color: #fff8e1;
    color: #f57c00;
  }

  .delete-btn {
    background-color: #ffebee;
    color: #d32f2f;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 1.5rem;
    gap: 1rem;
  }

  .page-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    background-color: white;
    border-radius: 4px;
    cursor: pointer;
  }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

  .page-info {
    font-size: 0.9rem;
    color: #666;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #5D5CDE;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }

  .error-message {
    padding: 1.5rem;
    background-color: #ffebee;
    color: #d32f2f;
    border-radius: 4px;
    text-align: center;
  }

  .retry-btn {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #5D5CDE;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-container {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #eee;
  }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #333;
    }

  .close-modal-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .form-group input,
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .cancel-btn,
  .save-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
  }

  .cancel-btn {
    background-color: white;
    border: 1px solid #ddd;
    color: #666;
  }

  .save-btn {
    background-color: #5D5CDE;
    border: none;
    color: white;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .admin-page-header h1 {
      color: #e2e8f0;
    }

    .admin-panel {
      background-color: #2d3748;
    }

    .search-box input,
    .filters select,
    .form-group input,
    .form-group textarea,
    .form-group select {
      background-color: #1a202c;
      border-color: #4a5568;
      color: #e2e8f0;
    }

    .data-table th {
      color: #e2e8f0;
    }

    .data-table th,
    .data-table td {
      border-bottom-color: #4a5568;
    }

    .page-btn {
      background-color: #2d3748;
      border-color: #4a5568;
      color: #e2e8f0;
    }

    .page-info {
      color: #a0aec0;
    }

    .empty-state {
      color: #a0aec0;
    }

    .modal-container {
      background-color: #2d3748;
    }

    .modal-header {
      border-bottom-color: #4a5568;
    }

      .modal-header h2 {
        color: #e2e8f0;
      }

    .close-modal-btn {
      color: #a0aec0;
    }

    .form-group label {
      color: #e2e8f0;
    }

    .cancel-btn {
      background-color: #2d3748;
      border-color: #4a5568;
      color: #e2e8f0;
    }

    /* Adjust status badges for dark mode */
    .status-active {
      background-color: rgba(56, 142, 60, 0.2);
    }

    .status-inactive {
      background-color: rgba(211, 47, 47, 0.2);
    }

    .view-btn {
      background-color: rgba(25, 118, 210, 0.2);
    }

    .edit-btn {
      background-color: rgba(56, 142, 60, 0.2);
    }

    .enable-btn {
      background-color: rgba(56, 142, 60, 0.2);
    }

    .disable-btn {
      background-color: rgba(245, 124, 0, 0.2);
    }

    .delete-btn {
      background-color: rgba(211, 47, 47, 0.2);
    }
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .search-filters {
      flex-direction: column;
    }

    .actions-cell {
      flex-wrap: wrap;
    }

    .action-btn {
      flex: 1;
      text-align: center;
    }

    .data-table {
      display: block;
      overflow-x: auto;
    }
  }
</style>
