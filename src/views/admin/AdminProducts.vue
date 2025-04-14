// src/views/admin/AdminProducts.vue
<template>
  <div class="admin-products">
    <div class="admin-page-header">
      <h1>Product Management</h1>
      <!-- Use enhanced button style -->
      <router-link to="/admin/products/add" class="button enhanced-button primary">
        <font-awesome-icon icon="plus" /> Add New Product
      </router-link>
    </div>

    <!-- Search and filters in an admin-panel -->
    <div class="admin-panel">
      <div class="search-filters">
        <div class="search-box filter-group">
          <label for="admin-product-search">Search</label>
          <input type="text"
                 id="admin-product-search"
                 v-model="searchQuery"
                 placeholder="Search products..."
                 @input="debounceSearch"
                 class="enhanced-input" />
        </div>
        <div class="filters">
          <div class="filter-group">
            <label for="admin-product-category">Category</label>
            <select id="admin-product-category" v-model="categoryFilter" @change="filterProducts" class="enhanced-input">
              <option value="">All Categories</option>
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label for="admin-product-status">Status</label>
            <select id="admin-product-status" v-model="statusFilter" @change="filterProducts" class="enhanced-input">
              <option value="">All Status</option>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Products table in an admin-panel -->
    <div class="admin-panel">
      <!-- Add h2 for table section -->
      <h2>Product List</h2>

      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading products...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <p>{{ error }}</p>
        <button @click="fetchProducts" class="button enhanced-button secondary">Try Again</button>
      </div>

      <!-- Use standard data-table class -->
      <table v-else-if="filteredProducts.length > 0" class="data-table">
        <thead>
          <tr>
            <th>Product #</th>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Category</th>
            <th>Status</th>
            <th class="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in filteredProducts" :key="product._id">
            <td>{{ product.productNumber || 'N/A' }}</td>
            <td class="image-cell">
              <img :src="product.images && product.images.length ? product.images[0] : placeholderImage"
                   :alt="product.name" />
            </td>
            <td>{{ product.name }}</td>
            <td>{{ formatCurrency(product.price) }}</td>
            <td>{{ product.category || 'N/A' }}</td>
            <td class="status-cell">
              <div class="toggle-container">
                <label class="toggle-switch">
                  <input type="checkbox"
                         :checked="product.enabled"
                         @change="toggleProductStatus(product)">
                  <span class="toggle-slider"></span>
                </label>
                <span class="toggle-label" :class="product.enabled ? 'status-active' : 'status-inactive'">
                  {{ product.enabled ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
            </td>
            <td class="actions-cell">
              <button class="action-btn view-btn" @click="viewProduct(product)">
                <font-awesome-icon icon="eye" /> View
              </button>
              <button class="action-btn edit-btn" @click="editProduct(product)">
                <font-awesome-icon icon="edit" /> Edit
              </button>
              <button class="action-btn delete-btn" @click="confirmDeleteProduct(product)">
                <font-awesome-icon icon="trash" /> Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty-state">
        <p>No products found.</p>
        <p v-if="searchQuery || categoryFilter || statusFilter !== ''">Try adjusting your search or filters.</p>
      </div>

      <nav v-if="totalPages > 1" class="pagination" aria-label="Product table pagination">
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
      </nav>
    </div>

    <div v-if="showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h2>{{ isNewProduct ? 'Add Product' : 'Edit Product' }}</h2>
          <button class="close-modal-btn" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveProduct">
            <div class="form-group" v-if="!isNewProduct">
              <label for="productNumber">Product Number</label>
              <input type="text" id="productNumber" v-model="editingProduct.productNumber" class="enhanced-input" readonly /> {/* Use enhanced-input */}
            </div>

            <div class="form-group">
              <label for="productName">Product Name</label>
              <input type="text" id="productName" v-model="editingProduct.name" class="enhanced-input" required />
            </div>

            <div class="form-group">
              <label for="productPrice">Price ($)</label>
              <input type="number" id="productPrice" v-model="editingProduct.price" step="0.01" min="0" class="enhanced-input" required />
            </div>

            <div class="form-group">
              <label for="productCategory">Category</label>
              <input type="text" id="productCategory" v-model="editingProduct.category" class="enhanced-input" />
            </div>

            <div class="form-group">
              <label for="productDescription">Description</label>
              <textarea id="productDescription" v-model="editingProduct.description" rows="4" class="enhanced-textarea"></textarea> {/* Use enhanced-textarea */}
            </div>

            {/* Attributes Section */}
            <div class="form-group">
              <label>Attributes</label>
              <div v-for="(attr, index) in editingProductAttributes" :key="index" class="attribute-row">
                {/* Use computed property */}
                <input type="text" v-model="attr.key" placeholder="Attribute name" class="attribute-input enhanced-input"> {/* Use enhanced-input */}
                <input type="text" v-model="attr.value" placeholder="Attribute value" class="attribute-input enhanced-input">
                <button type="button" @click="removeAttribute(index)" class="remove-attribute-btn">×</button> {/* Specific class */}
              </div>
              <button type="button" @click="addAttribute" class="add-attribute-btn button enhanced-button secondary small">Add Attribute</button> {/* Specific class */}
            </div>

            {/* Images Section */}
            <div class="form-group">
              <label>Product Images:</label>
              <div v-for="(imageUrl, index) in editingProductImages" :key="index" class="image-row">
                {/* Use computed property */}
                <input type="url" v-model="editingProductImages[index]" placeholder="Image URL" class="image-input enhanced-input" required>
                <button type="button" @click="removeImage(index)" class="remove-image-btn" :disabled="editingProductImages.length <= 1">×</button> {/* Specific class */}
              </div>
              <button type="button" @click="addImage" class="add-image-btn button enhanced-button secondary small">Add Another Image</button> {/* Specific class */}
              <p class="help-text">First image will be used as the main product image.</p>
            </div>

            {/* Image Preview */}
            <div class="image-preview-container" v-if="editingProductImages.length > 0 && editingProductImages[0]">
              <label>Image Previews:</label> {/* Add label */}
              <div class="previews-wrapper">
                {/* Add wrapper */}
                <div v-for="(imageUrl, index) in editingProductImages" :key="index" class="image-preview">
                  <img v-if="imageUrl" :src="imageUrl" :alt="`Product preview ${index + 1}`" class="preview-image">
                  <div v-else class="preview-placeholder">No image URL</div>
                  <div class="image-number">{{ index === 0 ? 'Main' : `#${index + 1}` }}</div>
                </div>
              </div>
            </div>

            {/* Actions moved to modal-actions */}
          </form>
        </div>
        {/* Modal Actions Footer */}
        <div class="modal-actions">
          <button type="button" class="button enhanced-button secondary" @click="closeModal">Cancel</button>
          <button type="button" class="button enhanced-button primary" @click="saveProduct" :disabled="isSaving">
            {/* Trigger save, disable */}
            {{ isSaving ? 'Saving...' : (isNewProduct ? 'Add Product' : 'Save Changes') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-container">
        <div class="modal-header">
          <h2>Confirm Delete</h2>
          <button class="close-modal-btn" @click="closeDeleteModal">×</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete product <strong>"{{ productToDelete?.name }}"</strong>?</p>
          <p v-if="productToDelete?.productNumber">Product #: {{ productToDelete.productNumber }}</p>
          <p class="warning-text">This action cannot be undone.</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="button enhanced-button secondary" @click="closeDeleteModal">Cancel</button>
          <button type="button" class="button enhanced-button danger" @click="deleteProductConfirmed" :disabled="isDeleting">
            {/* Use danger style */}
            {{ isDeleting ? 'Deleting...' : 'Delete Product' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
  // Import necessary Composition API functions and components
  import { ref, onMounted, computed, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { debounce } from 'lodash-es';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { library } from '@fortawesome/fontawesome-svg-core';
  import { faPlus, faEye, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

  // Add icons needed specifically for this component
  library.add(faPlus, faEye, faEdit, faTrash);

  // --- State ---
  const products = ref([]);
  const filteredProducts = ref([]);
  const loading = ref(true);
  const error = ref(null);
  const searchQuery = ref('');
  const categoryFilter = ref('');
  const statusFilter = ref(''); // Store as string 'true'/'false' or ''
  const categories = ref([]);
  const currentPage = ref(1);
  const itemsPerPage = ref(10); // Adjust as needed
  const totalItems = ref(0);
  const totalPages = ref(1);
  const searchTimeout = ref(null); // Use ref for timeout ID

  const showEditModal = ref(false);
  const isNewProduct = ref(false);
  const isSaving = ref(false);
  const isDeleting = ref(false); // Added deleting state

  const editingProduct = ref({ /* Initial empty state */ });
  const editingProductAttributes = ref([]); // Separate ref for attributes array
  const editingProductImages = ref(['']); // Separate ref for images array

  const showDeleteModal = ref(false);
  const productToDelete = ref(null);

  const placeholderImage = `https://via.placeholder.com/60x60/cccccc/FFFFFF?text=N/A`;

  const route = useRoute();
  const router = useRouter();

  // --- Computed Properties ---
  const hasActiveFilters = computed(() => {
    return searchQuery.value || categoryFilter.value || statusFilter.value !== '';
  });

  // --- Methods ---
  const formatCurrency = (amount) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  const fetchProducts = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Fetch ALL products for admin view
      const response = await fetch('/api/products/admin?limit=1000', { // Fetch more if needed, or implement server-side pagination/filtering
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json(); // Assuming the endpoint returns { products, totalProducts, ... }
      products.value = data.products || []; // Use the raw product list

      // Extract unique categories
      const categorySet = new Set(products.value.map(p => p.category).filter(Boolean));
      categories.value = Array.from(categorySet).sort();

      // Apply frontend filtering and pagination
      applyFiltersAndPagination();

    } catch (err) {
      console.error('Error fetching products:', err);
      error.value = 'Failed to load products. Please try again.';
      products.value = []; // Clear products on error
      applyFiltersAndPagination(); // Update display even on error
    } finally {
      loading.value = false;
    }
  };

  const applyFiltersAndPagination = () => {
    let tempFiltered = [...products.value];

    // Apply search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      tempFiltered = tempFiltered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (product.productNumber && product.productNumber.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (categoryFilter.value) {
      tempFiltered = tempFiltered.filter(product => product.category === categoryFilter.value);
    }

    // Apply status filter
    if (statusFilter.value !== '') {
      const enabled = statusFilter.value === 'true';
      tempFiltered = tempFiltered.filter(product => product.enabled === enabled);
    }

    // Update pagination totals based on filtered results
    totalItems.value = tempFiltered.length;
    totalPages.value = Math.ceil(totalItems.value / itemsPerPage.value);

    // Clamp currentPage if it's out of bounds after filtering
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value || 1;
    }

    // Apply pagination to the filtered list
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    filteredProducts.value = tempFiltered.slice(start, end);

    // Update URL (optional, but good practice)
    updateURLQueryParams();
  };


  const debounceSearch = debounce(() => {
    currentPage.value = 1; // Reset page on search
    applyFiltersAndPagination();
  }, 500); // Adjust delay as needed

  const filterProducts = () => {
    currentPage.value = 1; // Reset page on filter change
    applyFiltersAndPagination();
  };

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
      applyFiltersAndPagination(); // Re-apply pagination slice
    }
  };

  const updateURLQueryParams = () => {
    const query = {};
    if (currentPage.value > 1) query.page = currentPage.value;
    if (searchQuery.value) query.q = searchQuery.value;
    if (categoryFilter.value) query.category = categoryFilter.value;
    if (statusFilter.value !== '') query.status = statusFilter.value;

    // Only push if the query is different from the current route query
    if (JSON.stringify(query) !== JSON.stringify(route.query)) {
      router.replace({ query }).catch(err => {
        if (err.name !== 'NavigationDuplicated') { console.error('Router replace error:', err); }
      });
    }
  };


  const viewProduct = (product) => {
    router.push({ name: 'product-detail', params: { id: product._id } });
  };

  const editProduct = (product) => {
    isNewProduct.value = false;

    // Deep copy the product to avoid modifying the original object directly
    const productCopy = JSON.parse(JSON.stringify(product));

    // Convert attributes object to array format for the form
    const attributesArray = [];
    if (productCopy.attributes && typeof productCopy.attributes === 'object') {
      for (const [key, value] of Object.entries(productCopy.attributes)) {
        attributesArray.push({
          key,
          // Join array values with comma for editing, handle non-arrays
          value: Array.isArray(value) ? value.join(', ') : String(value)
        });
      }
    }

    editingProductAttributes.value = attributesArray; // Set the separate ref
    editingProductImages.value = productCopy.images && productCopy.images.length ? [...productCopy.images] : ['']; // Set the separate ref


    // Set the main editingProduct ref, EXCLUDING attributes and images initially
    editingProduct.value = {
      ...productCopy,
      attributes: undefined, // Exclude from main ref
      images: undefined // Exclude from main ref
    };

    showEditModal.value = true;
  };


  const closeModal = () => {
    showEditModal.value = false;
    editingProduct.value = {}; // Reset
    editingProductAttributes.value = [];
    editingProductImages.value = [''];
  };

  // Attribute management methods for the modal
  const addAttribute = () => {
    editingProductAttributes.value.push({ key: '', value: '' });
  };

  const removeAttribute = (index) => {
    editingProductAttributes.value.splice(index, 1);
  };

  // Image management methods for the modal
  const addImage = () => {
    editingProductImages.value.push('');
  };

  const removeImage = (index) => {
    if (editingProductImages.value.length > 1) {
      editingProductImages.value.splice(index, 1);
    } else {
      // Optionally clear the last input instead of removing it
      editingProductImages.value[0] = '';
    }
  };

  const saveProduct = async () => {
    isSaving.value = true;
    error.value = null; // Clear previous errors

    try {
      // 1. Validate Attributes (ensure unique keys, non-empty pairs)
      const uniqueKeys = new Set();
      const validAttributes = {};
      for (const attr of editingProductAttributes.value) {
        const key = attr.key.trim();
        const value = attr.value.trim();
        if (key && value) {
          if (uniqueKeys.has(key)) {
            throw new Error(`Duplicate attribute key found: "${key}"`);
          }
          uniqueKeys.add(key);
          // Store as array of strings (split by comma)
          validAttributes[key] = value.split(',').map(v => v.trim()).filter(Boolean);
        } else if (key || value) {
          // Allow empty pairs to be ignored, but throw error if only one part is filled? Your choice.
          console.warn(`Ignoring attribute pair with empty key or value:`, attr);
        }
      }

      // 2. Validate Images (ensure at least one non-empty URL)
      const validImages = editingProductImages.value.filter(url => url && url.trim() !== '');
      if (validImages.length === 0) {
        throw new Error('Please provide at least one valid image URL.');
      }

      // 3. Prepare Payload (exclude internal/computed properties)
      const payload = {
        name: editingProduct.value.name,
        price: parseFloat(editingProduct.value.price) || 0,
        description: editingProduct.value.description,
        category: editingProduct.value.category,
        enabled: editingProduct.value.enabled, // Include enabled status
        images: validImages,
        attributes: validAttributes,
        // Include productNumber only when editing an existing product (if needed by backend PUT)
        // productNumber: isNewProduct.value ? undefined : editingProduct.value.productNumber,
        // Exclude _id, createdAt, updatedAt, __v etc. if present in editingProduct.value
        _id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        __v: undefined
      };

      // Remove potentially undefined properties if backend is strict
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);


      // 4. Determine API Endpoint and Method
      const url = isNewProduct.value
        ? '/api/products'
        : `/api/products/${editingProduct.value._id}`;
      const method = isNewProduct.value ? 'POST' : 'PUT';

      // 5. Make API Call
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to parse error
        throw new Error(errorData.message || `Failed to save product. Status: ${response.status}`);
      }

      // 6. Handle Success
      await fetchProducts(); // Refetch the entire list to ensure consistency
      closeModal();
      alert(`Product ${isNewProduct.value ? 'added' : 'updated'} successfully!`);

    } catch (err) {
      console.error('Error saving product:', err);
      error.value = err.message || 'An unexpected error occurred while saving.';
      alert(`Error: ${error.value}`); // Show error to user
    } finally {
      isSaving.value = false;
    }
  };


  const toggleProductStatus = async (product) => {
    const originalStatus = product.enabled;
    // Optimistic UI update
    product.enabled = !product.enabled;

    try {
      const response = await fetch(`/api/products/${product._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled: product.enabled })
      });

      if (!response.ok) {
        // Revert UI on failure
        product.enabled = originalStatus;
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update product status');
      }
      // Success: UI already updated
      // Optional: Show success message
      applyFiltersAndPagination(); // Re-apply filters if status filter is active

    } catch (err) {
      // Revert UI on failure (already done if response not ok)
      product.enabled = originalStatus;
      console.error('Error toggling product status:', err);
      alert(err.message || 'Error updating product status');
    }
  };

  const confirmDeleteProduct = (product) => {
    productToDelete.value = product;
    showDeleteModal.value = true;
  };

  const closeDeleteModal = () => {
    showDeleteModal.value = false;
    productToDelete.value = null;
  };

  const deleteProductConfirmed = async () => {
    if (!productToDelete.value) return;
    isDeleting.value = true;
    error.value = null;

    try {
      const response = await fetch(`/api/products/${productToDelete.value._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete product');
      }

      // Remove product from the main list *before* filtering
      products.value = products.value.filter(p => p._id !== productToDelete.value._id);

      // Re-apply filters and pagination
      applyFiltersAndPagination();

      alert(`Product "${productToDelete.value.name}" deleted successfully.`);
      closeDeleteModal();

    } catch (err) {
      console.error('Error deleting product:', err);
      error.value = err.message || 'An error occurred while deleting the product.';
      alert(`Error: ${error.value}`);
    } finally {
      isDeleting.value = false;
    }
  };

  // --- Lifecycle Hooks ---
  onMounted(() => {
    fetchProducts();
  });

  // Watchers for reactive filtering
  watch(categoryFilter, () => filterProducts());
  watch(statusFilter, () => filterProducts());

</script>

<style scoped>
  /* Reuse styles from main.css where possible using variables */
  /* Add specific layout styles */

  .admin-products {
    width: 100%;
  }

  /* Use styles from main.css */
  /* .admin-page-header { } */
  /* .admin-page-header h1 { } */
  /* .button.enhanced-button.primary { } */

  /* Use styles from main.css */
  /* .admin-panel { } */

  .search-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-end; /* Align bottom edges */
  }

  .search-box {
    flex: 1 1 300px; /* Allow shrinking but prefer 300px */
  }

  .filters {
    display: flex;
    gap: 1rem;
    flex: 1 1 auto; /* Allow filter selects to take space */
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    flex: 1 1 180px; /* Each filter group takes space */
  }

  .search-box input,
  .filters select {
    /* Use enhanced-input styles from main.css */
  }

  /* Use styles from main.css */
  /* .data-table { } */
  /* .data-table th, .data-table td { } */
  /* .data-table th { } */

  .image-cell {
    width: 70px; /* Fixed width */
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

    .image-cell img {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: var(--border-radius-small);
      border: 1px solid var(--border-color);
      display: block; /* Remove extra space below image */
    }

  .status-cell {
    min-width: 160px; /* Ensure space for toggle + label */
  }

  .toggle-container {
    display: flex;
    align-items: center;
    gap: 0.75rem; /* Space between toggle and label */
  }

  .toggle-label {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-active {
    color: #388e3c; /* Green */
  }

  .status-inactive {
    color: #d32f2f; /* Red */
  }

  /* Toggle Switch Styles */
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 40px; /* Width of the switch */
    height: 20px; /* Height of the switch */
    flex-shrink: 0; /* Prevent shrinking */
  }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc; /* Default off color */
    transition: .4s;
    border-radius: 20px; /* Fully rounded */
  }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 16px; /* Size of the knob */
      width: 16px;
      left: 2px; /* Padding from edge */
      bottom: 2px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }

  input:checked + .toggle-slider {
    background-color: var(--primary); /* Active color */
  }

  input:focus + .toggle-slider {
    box-shadow: 0 0 1px var(--primary);
  }

  input:checked + .toggle-slider:before {
    transform: translateX(20px); /* Move knob across */
  }

  .actions-cell {
    white-space: nowrap; /* Prevent buttons wrapping */
    text-align: right; /* Align actions to the right */
  }

  .actions-header {
    text-align: right; /* Align header right */
  }

  /* Use styles from main.css */
  /* .action-btn { } */
  /* .view-btn { } */
  /* .edit-btn { } */
  /* .delete-btn { } */

  /* Use styles from main.css */
  /* .pagination { } */
  /* .page-btn { } */
  /* .page-info { } */

  /* Use styles from main.css */
  /* .loading-container { } */
  /* .loading-spinner { } */
  /* .error-container { } */ /* Updated class name */
  /* .retry-btn { Use enhanced-button secondary } */
  /* .empty-state { } */

  /* Modal styles - Use styles from main.css */
  /* .modal-overlay { } */
  /* .modal-container { } */
  /* .modal-header { } */
  /* .modal-header h2 { } */
  /* .close-modal-btn { } */
  /* .modal-body { } */
  /* .modal-body .warning-text { } */
  /* .modal-actions { } */
  /* .modal-actions .cancel-btn { Use enhanced-button secondary } */
  /* .modal-actions .save-btn { Use enhanced-button primary } */
  /* .modal-actions .delete-btn { Use enhanced-button danger } */

  /* Attribute and image management styles */
  .attribute-row, .image-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    align-items: center;
  }

  .attribute-input, .image-input {
    flex: 1; /* Inputs take available space */
  }

  .remove-attribute-btn, .remove-image-btn {
    background-color: transparent;
    border: 1px solid var(--secondary);
    color: var(--secondary);
    border-radius: 50%; /* Circle */
    width: 28px;
    height: 28px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

    .remove-attribute-btn:hover, .remove-image-btn:hover {
      background-color: var(--secondary);
      color: var(--white);
    }

  .add-attribute-btn, .add-image-btn {
    margin-top: 0.5rem;
    /* Use enhanced-button secondary small styles */
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
    width: auto; /* Don't force full width */
    display: inline-flex;
  }

  .help-text {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 0.5rem;
    display: block;
  }

  .image-preview-container {
    margin-top: 1rem;
    border-top: 1px solid var(--border-color);
    padding-top: 1rem;
  }

    .image-preview-container label { /* Added label */
      display: block;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: var(--text-dark);
    }

  .previews-wrapper { /* Added wrapper */
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
  }

  .image-preview {
    width: 80px; /* Smaller preview */
    text-align: center;
  }

  .preview-image {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: var(--border-radius-small);
    border: 1px solid var(--border-color);
  }

  .preview-placeholder {
    width: 80px;
    height: 80px;
    background-color: var(--bg-off-light);
    border: 1px dashed var(--border-color);
    border-radius: var(--border-radius-small);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 0.75rem;
    line-height: 1.2;
  }

  .image-number {
    font-size: 0.75rem;
    margin-top: 0.25rem;
    color: var(--text-muted);
  }

  /* Responsive Adjustments */
  @media (max-width: 992px) {
    .data-table {
      display: block;
      overflow-x: auto;
      white-space: nowrap;
    }

      .data-table th, .data-table td {
        white-space: nowrap;
      }

    .actions-cell {
      min-width: 200px;
    }
    /* Ensure actions fit */
  }

  @media (max-width: 768px) {
    .search-filters {
      flex-direction: column;
      align-items: stretch;
    }

    .filters {
      flex-direction: column;
      width: 100%;
    }

    .filter-group {
      flex-basis: auto;
    }

    .admin-page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
  }
</style>
