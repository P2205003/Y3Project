<template>
  <div class="admin-dashboard">
    <h1>Admin Dashboard</h1>

    <!-- Tabs navigation -->
    <div class="dashboard-tabs">
      <button :class="{ 'active-tab': activeTab === 'products' }"
              @click="activeTab = 'products'">
        Products Management
      </button>
      <button :class="{ 'active-tab': activeTab === 'orders' }"
              @click="activeTab = 'orders'">
        Orders Management
      </button>
    </div>

    <!-- Products Tab Content -->
    <div v-if="activeTab === 'products'" class="tab-content">
      <div class="actions-bar">
        <h2>Products</h2>
        <div class="search-container">
          <input type="text"
                 v-model="productSearchQuery"
                 @input="searchProducts"
                 placeholder="Search products by name or ID"
                 class="search-input">
        </div>
        <router-link to="/add-item">
          <button class="add-btn">Add New Product</button>
        </router-link>
      </div>

      <!-- Loading state -->
      <div v-if="productsLoading" class="loading-indicator">
        <p>Loading products...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="productsError" class="error-message">
        <p>{{ productsError }}</p>
        <button @click="fetchProducts">Try Again</button>
      </div>

      <!-- Products table -->
      <table v-else class="products-table">
        <thead>
          <tr>
            <th>ID</th>
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
            <td class="id-cell">{{ product._id }}</td>
            <td class="image-cell">
              <img :src="product.images && product.images.length > 0 ? product.images[0] : placeholderImage"
                   alt="Product image"
                   class="product-thumbnail">
            </td>
            <td>{{ product.name }}</td>
            <td>${{ product.price.toFixed(2) }}</td>
            <td>{{ product.category || 'Uncategorized' }}</td>
            <td>
              <span :class="{ 'status-enabled': product.enabled, 'status-disabled': !product.enabled }">
                {{ product.enabled ? 'Enabled' : 'Disabled' }}
              </span>
            </td>
            <td class="actions-cell">
              <button @click="viewProduct(product._id)" class="view-btn">View</button>
              <button @click="editProduct(product)" class="edit-btn">Edit</button>
              <button @click="toggleProductStatus(product)"
                      :class="product.enabled ? 'disable-btn' : 'enable-btn'">
                {{ product.enabled ? 'Disable' : 'Enable' }}
              </button>
              <button @click="confirmDeleteProduct(product)" class="delete-btn">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- No products found message -->
      <div v-if="filteredProducts.length === 0 && !productsLoading" class="no-results">
        <p>No products found matching your search criteria.</p>
      </div>
    </div>

    <!-- Orders Tab Content -->
    <div v-if="activeTab === 'orders'" class="tab-content">
      <div class="actions-bar">
        <h2>Orders</h2>
        <div class="filter-container">
          <label for="statusFilter">Filter by Status:</label>
          <select id="statusFilter" v-model="orderStatusFilter" class="status-filter">
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="cancelled">Cancelled</option>
            <option value="hold">Hold</option>
          </select>
        </div>
      </div>

      <!-- Orders placeholder message (since the backend doesn't have orders yet) -->
      <div class="placeholder-message">
        <p>Order management functionality is under development.</p>
        <p>This will display customer orders with filtering by status when implemented.</p>
      </div>

      <!-- Sample static order data (for demonstration) -->
      <table class="orders-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ORD-001</td>
            <td>2023-05-15</td>
            <td>John Smith</td>
            <td>$125.99</td>
            <td>
              <span class="status-pending">Pending</span>
            </td>
            <td>
              <button class="view-btn">View Details</button>
            </td>
          </tr>
          <tr>
            <td>ORD-002</td>
            <td>2023-05-14</td>
            <td>Jane Doe</td>
            <td>$85.50</td>
            <td>
              <span class="status-shipped">Shipped</span>
            </td>
            <td>
              <button class="view-btn">View Details</button>
            </td>
          </tr>
          <tr>
            <td>ORD-003</td>
            <td>2023-05-13</td>
            <td>Robert Johnson</td>
            <td>$210.25</td>
            <td>
              <span class="status-cancelled">Cancelled</span>
            </td>
            <td>
              <button class="view-btn">View Details</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit Product Modal -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-content">
        <span class="close-modal" @click="cancelEdit">&times;</span>
        <h2>Edit Product</h2>

        <form @submit.prevent="saveProduct">
          <!-- Product Name -->
          <div class="form-group">
            <label for="editName">Product Name:</label>
            <input type="text"
                   id="editName"
                   v-model="editingProduct.name"
                   required>
          </div>

          <!-- Product Price -->
          <div class="form-group">
            <label for="editPrice">Price ($):</label>
            <input type="number"
                   id="editPrice"
                   v-model="editingProduct.price"
                   min="0"
                   step="0.01"
                   required>
          </div>

          <!-- Product Description -->
          <div class="form-group">
            <label for="editDescription">Description:</label>
            <textarea id="editDescription"
                      v-model="editingProduct.description"
                      rows="4"></textarea>
          </div>

          <!-- Product Category -->
          <div class="form-group">
            <label for="editCategory">Category:</label>
            <input type="text"
                   id="editCategory"
                   v-model="editingProduct.category">
          </div>

          <!-- Product Status -->
          <div class="form-group">
            <label for="editEnabled">Status:</label>
            <select id="editEnabled" v-model="editingProduct.enabled">
              <option :value="true">Enabled</option>
              <option :value="false">Disabled</option>
            </select>
          </div>

          <!-- Product Images -->
          <div class="form-group">
            <label>Product Images:</label>
            <div v-for="(imageUrl, index) in editingProduct.images" :key="index" class="image-edit-row">
              <input type="url"
                     v-model="editingProduct.images[index]"
                     placeholder="Image URL"
                     class="image-input">
              <button type="button"
                      @click="removeImage(index)"
                      class="remove-btn"
                      :disabled="editingProduct.images.length <= 1">
                &times;
              </button>
            </div>
            <button type="button"
                    @click="addImage"
                    class="add-btn-small">
              Add Image
            </button>
          </div>

          <div class="form-actions">
            <button type="button" @click="cancelEdit" class="cancel-btn">Cancel</button>
            <button type="submit" class="save-btn">Save Changes</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-content delete-modal">
        <span class="close-modal" @click="cancelDelete">&times;</span>
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete the product "{{ productToDelete?.name }}"?</p>
        <p class="delete-warning">This action cannot be undone.</p>

        <div v-if="deleteError" class="delete-error-message">
          <p>{{ deleteError }}</p>
        </div>

        <div class="form-actions">
          <button type="button" @click="cancelDelete" class="cancel-btn" :disabled="deleteLoading">Cancel</button>
          <button type="button" @click="deleteProduct" class="delete-confirm-btn" :disabled="deleteLoading">
            <span v-if="deleteLoading">Deleting...</span>
            <span v-else>Delete Product</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'AdminDashboard',
    data() {
      return {
        activeTab: 'products',
        // Products tab
        productsLoading: true,
        productsError: null,
        allProducts: [],
        productSearchQuery: '',
        placeholderImage: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1a3f85814e0%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1a3f85814e0%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2274.5%22%20y%3D%22104.8%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E',
        // Edit product modal
        showEditModal: false,
        editingProduct: null,
        originalProduct: null,
        // Delete product modal
        showDeleteModal: false,
        productToDelete: null,
        deleteLoading: false,
        deleteError: null,
        // Orders tab
        orderStatusFilter: 'all'
      };
    },
    computed: {
      filteredProducts() {
        if (!this.productSearchQuery) {
          return this.allProducts;
        }

        const query = this.productSearchQuery.toLowerCase();
        return this.allProducts.filter(product => {
          return (
            product.name.toLowerCase().includes(query) ||
            product._id.toLowerCase().includes(query) ||
            (product.category && product.category.toLowerCase().includes(query))
          );
        });
      }
    },
    methods: {
      async fetchProducts() {
        this.productsLoading = true;
        this.productsError = null;

        try {
          // Fetch all products, including disabled ones (admin should see all)
          const response = await fetch('/api/products/admin', {
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          this.allProducts = await response.json();
        } catch (error) {
          console.error('Error fetching products:', error);
          this.productsError = 'Failed to load products. ' + error.message;
        } finally {
          this.productsLoading = false;
        }
      },
      searchProducts() {
        // The computed property handles the filtering
      },
      viewProduct(productId) {
        this.$router.push({ name: 'ProductPage', params: { id: productId } });
      },
      editProduct(product) {
        // Clone the product to avoid modifying the original directly
        this.originalProduct = product;
        this.editingProduct = JSON.parse(JSON.stringify(product));

        // Ensure images array exists
        if (!this.editingProduct.images) {
          this.editingProduct.images = [''];
        }

        this.showEditModal = true;
      },
      cancelEdit() {
        this.showEditModal = false;
        this.editingProduct = null;
      },
      addImage() {
        this.editingProduct.images.push('');
      },
      removeImage(index) {
        if (this.editingProduct.images.length > 1) {
          this.editingProduct.images.splice(index, 1);
        }
      },
      async saveProduct() {
        try {
          const response = await fetch(`/api/products/${this.editingProduct._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(this.editingProduct)
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
          }

          // Update the product in the local list
          const updatedProduct = await response.json();
          const index = this.allProducts.findIndex(p => p._id === updatedProduct._id);
          if (index !== -1) {
            this.allProducts.splice(index, 1, updatedProduct);
          }

          this.showEditModal = false;
          this.$message.success('Product updated successfully!');
        } catch (error) {
          console.error('Error updating product:', error);
          this.$message.error('Failed to update product: ' + error.message);
        }
      },
      async toggleProductStatus(product) {
        try {
          const newStatus = !product.enabled;
          const response = await fetch(`/api/products/${product._id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ enabled: newStatus })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
          }

          // Update the product status in the local list
          product.enabled = newStatus;
          this.$message.success(`Product ${newStatus ? 'enabled' : 'disabled'} successfully!`);
        } catch (error) {
          console.error('Error toggling product status:', error);
          this.$message.error('Failed to update product status: ' + error.message);
        }
      },
      confirmDeleteProduct(product) {
        this.productToDelete = product;
        this.showDeleteModal = true;
        this.deleteError = null;
      },
      cancelDelete() {
        this.showDeleteModal = false;
        this.productToDelete = null;
        this.deleteLoading = false;
        this.deleteError = null;
      },
      async deleteProduct() {
        if (!this.productToDelete) return;

        this.deleteLoading = true;
        this.deleteError = null;

        try {
          const response = await fetch(`/api/products/${this.productToDelete._id}`, {
            method: 'DELETE',
            headers: {
              'Accept': 'application/json'
            },
            credentials: 'include'
          });

          let responseData;
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
          } else {
            // If response is not JSON, get the text and create an error message
            const textResponse = await response.text();
            if (!response.ok) {
              throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 100)}...`);
            }
            // If response is OK but not JSON, create a success message
            responseData = { message: 'Product deleted successfully' };
          }

          if (!response.ok) {
            throw new Error(responseData.message || `HTTP error! Status: ${response.status}`);
          }

          // Remove the product from the local list
          const index = this.allProducts.findIndex(p => p._id === this.productToDelete._id);
          if (index !== -1) {
            this.allProducts.splice(index, 1);
          }

          this.$message.success(responseData.message || 'Product deleted successfully!');
          this.showDeleteModal = false;
          this.productToDelete = null;
        } catch (error) {
          console.error('Error deleting product:', error);
          this.deleteError = 'Failed to delete product: ' + error.message;
          this.$message.error(this.deleteError);
        } finally {
          this.deleteLoading = false;
        }
      }
    },
    created() {
      this.fetchProducts();
    }
  };
</script>

<style scoped>
  .admin-dashboard {
    padding: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  h1 {
    color: #333;
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
  }

  /* Tab Navigation */
  .dashboard-tabs {
    display: flex;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #e0e0e0;
  }

    .dashboard-tabs button {
      padding: 0.75rem 1.5rem;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      font-size: 1rem;
      cursor: pointer;
      margin-right: 0.5rem;
      color: #666;
      transition: all 0.2s;
    }

      .dashboard-tabs button:hover {
        color: #5D5CDE;
      }

      .dashboard-tabs button.active-tab {
        color: #5D5CDE;
        border-bottom-color: #5D5CDE;
        font-weight: 600;
      }

  /* Actions Bar */
  .actions-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

    .actions-bar h2 {
      margin: 0;
      font-size: 1.4rem;
      color: #333;
    }

  .search-container, .filter-container {
    display: flex;
    align-items: center;
  }

  .search-input, .status-filter {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    min-width: 250px;
  }

  /* Buttons */
  .add-btn {
    background-color: #5D5CDE;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.2s;
  }

    .add-btn:hover {
      background-color: #4a49b8;
    }

  /* Tables */
  .products-table, .orders-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

    .products-table th, .products-table td,
    .orders-table th, .orders-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }

    .products-table th, .orders-table th {
      background-color: #f5f5f5;
      font-weight: 600;
    }

    .products-table tr:hover, .orders-table tr:hover {
      background-color: #f9f9f9;
    }

  .id-cell {
    color: #777;
    font-size: 0.8rem;
    font-family: monospace;
  }

  .image-cell {
    width: 80px;
  }

  .product-thumbnail {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #eee;
  }

  .actions-cell {
    display: flex;
    gap: 0.5rem;
  }

  /* Status indicators */
  .status-enabled {
    color: #4caf50;
    font-weight: 600;
  }

  .status-disabled {
    color: #f44336;
    font-weight: 600;
  }

  .status-pending {
    color: #ff9800;
    font-weight: 600;
  }

  .status-shipped {
    color: #4caf50;
    font-weight: 600;
  }

  .status-cancelled {
    color: #f44336;
    font-weight: 600;
  }

  .status-hold {
    color: #9e9e9e;
    font-weight: 600;
  }

  /* Action Buttons */
  .view-btn, .edit-btn, .enable-btn, .disable-btn, .delete-btn {
    padding: 0.35rem 0.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: background-color 0.2s;
  }

  .view-btn {
    background-color: #e0e0e0;
    color: #333;
  }

    .view-btn:hover {
      background-color: #d0d0d0;
    }

  .edit-btn {
    background-color: #2196f3;
    color: white;
  }

    .edit-btn:hover {
      background-color: #0b7dda;
    }

  .enable-btn {
    background-color: #4caf50;
    color: white;
  }

    .enable-btn:hover {
      background-color: #3d8b40;
    }

  .disable-btn {
    background-color: #f44336;
    color: white;
  }

    .disable-btn:hover {
      background-color: #d32f2f;
    }

  .delete-btn {
    background-color: #f44336;
    color: white;
  }

    .delete-btn:hover {
      background-color: #d32f2f;
    }

  .delete-confirm-btn {
    background-color: #f44336;
    color: white;
    padding: 0.6rem 1.25rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

    .delete-confirm-btn:hover {
      background-color: #d32f2f;
    }

    .delete-confirm-btn:disabled {
      background-color: #f4433680;
      cursor: not-allowed;
    }

  .delete-warning {
    color: #f44336;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .delete-error-message {
    background-color: #ffebee;
    color: #f44336;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    border-left: 4px solid #f44336;
  }

  .delete-modal {
    max-width: 500px;
  }

  /* Loading, Error and Empty states */
  .loading-indicator, .error-message, .no-results, .placeholder-message {
    text-align: center;
    padding: 2rem;
    background-color: #f9f9f9;
    border-radius: 4px;
    margin-bottom: 2rem;
  }

    .loading-indicator p {
      color: #666;
    }

  .error-message {
    color: #f44336;
  }

    .error-message button {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background-color: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

      .error-message button:hover {
        background-color: #d32f2f;
      }

  .no-results, .placeholder-message {
    color: #666;
    font-style: italic;
  }

  /* Edit Product Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
  }

  .close-modal {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
  }

    .close-modal:hover {
      color: #333;
    }

  .form-group {
    margin-bottom: 1.25rem;
  }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #333;
    }

    .form-group input, .form-group textarea, .form-group select {
      width: 100%;
      padding: 0.6rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

  .image-edit-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .image-input {
    flex: 1;
  }

  .add-btn-small {
    background-color: #5D5CDE;
    color: white;
    border: none;
    padding: 0.4rem 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }

    .add-btn-small:hover {
      background-color: #4a49b8;
    }

  .remove-btn {
    background-color: #f44336;
    color: white;
    border: none;
    width: 30px;
    height: 30px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.2rem;
  }

    .remove-btn:disabled {
      background-color: #e0e0e0;
      cursor: not-allowed;
    }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .cancel-btn, .save-btn {
    padding: 0.6rem 1.25rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  .cancel-btn {
    background-color: #e0e0e0;
    color: #333;
  }

    .cancel-btn:hover {
      background-color: #d0d0d0;
    }

    .cancel-btn:disabled {
      background-color: #e0e0e080;
      cursor: not-allowed;
    }

  .save-btn {
    background-color: #5D5CDE;
    color: white;
  }

    .save-btn:hover {
      background-color: #4a49b8;
    }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .actions-bar {
      flex-direction: column;
      align-items: flex-start;
    }

    .search-input, .status-filter {
      min-width: 100%;
    }

    .actions-cell {
      flex-direction: column;
    }

    .view-btn, .edit-btn, .enable-btn, .disable-btn, .delete-btn {
      width: 100%;
      margin-bottom: 0.25rem;
    }

    /* Hide less important columns on small screens */
    .products-table th:nth-child(1),
    .products-table td:nth-child(1),
    .orders-table th:nth-child(1),
    .orders-table td:nth-child(1) {
      display: none;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .admin-dashboard {
      background-color: #121212;
      color: #e0e0e0;
    }

    h1, h2 {
      color: #e0e0e0;
    }

    .dashboard-tabs {
      border-bottom-color: #333;
    }

      .dashboard-tabs button {
        color: #aaa;
      }

        .dashboard-tabs button:hover,
        .dashboard-tabs button.active-tab {
          color: #5D5CDE;
        }

    .products-table th, .orders-table th {
      background-color: #282828;
      color: #e0e0e0;
    }

    .products-table td, .orders-table td {
      border-bottom-color: #333;
    }

    .products-table tr:hover, .orders-table tr:hover {
      background-color: #1e1e1e;
    }

    .loading-indicator, .error-message, .no-results, .placeholder-message {
      background-color: #1e1e1e;
      color: #aaa;
    }

    .modal-content {
      background-color: #1e1e1e;
      color: #e0e0e0;
    }

    .form-group label {
      color: #e0e0e0;
    }

    .form-group input, .form-group textarea, .form-group select {
      background-color: #282828;
      border-color: #444;
      color: #e0e0e0;
    }

    .cancel-btn {
      background-color: #444;
      color: #e0e0e0;
    }

      .cancel-btn:hover {
        background-color: #555;
      }

      .cancel-btn:disabled {
        background-color: #44444480;
      }

    .delete-warning {
      color: #f77066;
    }

    .delete-error-message {
      background-color: #321c1c;
      border-left: 4px solid #f44336;
      color: #f77066;
    }
  }
</style>
