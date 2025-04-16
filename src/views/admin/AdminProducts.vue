// src/views/admin/AdminProducts.vue
<template>
  <div class="admin-products">
    <div class="admin-page-header">
      <h1>Product Management</h1>
      <router-link to="/admin/products/add" class="button enhanced-button primary">
        <font-awesome-icon icon="plus" /> Add New Product
      </router-link>
    </div>

    <!-- Search and filters -->
    <div class="admin-panel">
      <div class="search-filters">
        <div class="search-box filter-group">
          <label for="admin-product-search">Search</label>
          <input type="text"
                 id="admin-product-search"
                 v-model="searchQuery"
                 placeholder="Search by Name, #, Category..."
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

    <!-- Products table -->
    <div class="admin-panel">
      <h2>Product List</h2>
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div> <p>Loading products...</p>
      </div>
      <div v-else-if="error" class="error-container">
        <p>{{ error }}</p>
        <button @click="fetchProducts" class="button enhanced-button secondary">Try Again</button>
      </div>
      <div v-else>
        <div class="table-responsive-wrapper">
          <table v-if="filteredProducts.length > 0" class="data-table">
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
              <tr v-for="product in paginatedProducts" :key="product._id">
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
        </div>

        <div v-if="filteredProducts.length === 0" class="empty-state">
          <p>No products found.</p>
          <p v-if="searchQuery || categoryFilter || statusFilter !== ''">Try adjusting your search or filters.</p>
        </div>

        <!-- Pagination (based on filteredProducts length) -->
        <nav v-if="totalPages > 1" class="pagination users-pagination" aria-label="Product table pagination">
          <button :disabled="currentPage === 1 || loading"
                  @click="changePage(currentPage - 1)"
                  class="page-btn">
            Previous
          </button>
          <div class="page-info">
            Page {{ currentPage }} of {{ totalPages }} ({{ totalItems }} products)
          </div>
          <button :disabled="currentPage === totalPages || loading"
                  @click="changePage(currentPage + 1)"
                  class="page-btn">
            Next
          </button>
        </nav>
      </div>
    </div>

    <!-- EDIT MODAL (Updated Structure) -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h2>{{ modalTitle }}</h2>
          <button class="close-modal-btn" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="saveProduct">
          <div class="modal-body">
            <!-- === Core English Fields === -->
            <div class="form-section modal-form-section">
              <h3><font-awesome-icon icon="flag-usa" /> Base (English) Details</h3>
              <div class="form-group">
                <label for="modal-productNumber">Product Number</label>
                <input type="text" id="modal-productNumber" v-model="editingProduct.productNumber" class="enhanced-input" readonly disabled />
              </div>
              <div class="form-grid">
                <div class="form-column">
                  <div class="form-group">
                    <label for="modal-productName">Product Name <span class="required">*</span></label>
                    <input type="text" id="modal-productName" v-model="editingProduct.name" class="enhanced-input" required />
                  </div>
                  <div class="form-group">
                    <label for="modal-productPrice">Price ($) <span class="required">*</span></label>
                    <input type="number" id="modal-productPrice" v-model="editingProduct.price" step="0.01" min="0" class="enhanced-input" required />
                  </div>
                  <div class="form-group">
                    <label for="modal-productCategory">Category</label>
                    <input type="text" id="modal-productCategory" v-model="editingProduct.category" class="enhanced-input" list="category-suggestions-edit" />
                    <datalist id="category-suggestions-edit">
                      <option v-for="cat in categories" :key="`cat-edit-${cat}`" :value="cat"></option>
                    </datalist>
                  </div>
                </div>
                <div class="form-column">
                  <div class="form-group">
                    <label for="modal-productDescription">Description</label>
                    <textarea id="modal-productDescription" v-model="editingProduct.description" rows="4" class="enhanced-textarea"></textarea>
                  </div>
                  <div class="form-group">
                    <label for="modal-slug">URL Slug</label>
                    <input type="text" id="modal-slug" v-model="editingProduct.slug" class="enhanced-input">
                  </div>
                  <div class="form-group checkbox-group">
                    <input type="checkbox" id="modal-enabled" v-model="editingProduct.enabled" />
                    <label for="modal-enabled">Product Enabled</label>
                  </div>
                </div>
              </div>
            </div>
            <!-- === English Attributes & Images === -->
            <div class="form-section modal-form-section">
              <h3><font-awesome-icon icon="tags" /> Base Attributes & Images</h3>
              <div class="form-grid">
                <div class="form-column">
                  <div class="form-group attributes-section">
                    <label>Attributes (English)</label>
                    <div v-if="editingProductAttributes.length === 0" class="no-attributes-message">No base attributes added.</div>
                    <div v-for="(attr, index) in editingProductAttributes" :key="`edit-base-attr-${index}`" class="attribute-row">
                      <input type="text" v-model="attr.key" placeholder="Attribute Name" class="attribute-input enhanced-input">
                      <input type="text" v-model="attr.value" placeholder="Value(s), comma-sep" class="attribute-input enhanced-input">
                      <button type="button" @click="removeAttribute(index)" class="action-btn delete-btn attribute-remove-btn" title="Remove Attribute">
                        <font-awesome-icon icon="trash-alt" />
                      </button>
                    </div>
                    <button type="button" @click="addAttribute" class="add-attribute-btn button enhanced-button secondary small">Add Base Attribute</button>
                  </div>
                </div>
                <div class="form-column">
                  <div class="form-group images-section">
                    <label>Product Images <span class="required">*</span></label>
                    <div v-for="(imageUrl, index) in editingProductImages" :key="`edit-img-${index}`" class="image-row">
                      <input type="url" v-model="editingProductImages[index]" placeholder="Image URL" class="image-input enhanced-input" :required="index === 0">
                      <button type="button" @click="removeImage(index)" class="action-btn delete-btn image-remove-btn" :disabled="editingProductImages.length <= 1">
                        <font-awesome-icon icon="trash-alt" />
                      </button>
                    </div>
                    <button type="button" @click="addImage" class="add-image-btn button enhanced-button secondary small">Add Image URL</button>
                  </div>
                  <!-- Image Preview -->
                  <div class="image-preview-container" v-if="editingProductImages.length > 0 && editingProductImages[0]">
                    <label>Image Previews:</label>
                    <div class="previews-wrapper">
                      <div v-for="(imageUrl, index) in editingProductImages" :key="`edit-preview-${index}`" class="image-preview">
                        <img v-if="imageUrl && isUrlValid(imageUrl)" :src="imageUrl" :alt="`Product preview ${index + 1}`" class="preview-image">
                        <div v-else class="preview-placeholder">No image URL</div>
                        <div class="image-number">{{ index === 0 ? 'Main' : `#${index + 1}` }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- === Translations Section === -->
            <div class="form-section modal-form-section translations-section">
              <h3><font-awesome-icon icon="language" /> Translations</h3>
              <div class="translation-tabs">
                <button v-for="lang in supportedLocales.filter(l => l.code !== 'en')"
                        :key="lang.code"
                        type="button"
                        class="translation-tab"
                        :class="{ active: activeTranslationTab === lang.code }"
                        @click="activeTranslationTab = lang.code">
                  {{ lang.name }}
                </button>
              </div>
              <!-- Translation Panes -->
              <div v-for="lang in supportedLocales.filter(l => l.code !== 'en')"
                   :key="`edit-trans-${lang.code}`"
                   v-show="activeTranslationTab === lang.code"
                   class="translation-pane">
                <h4>Editing: {{ lang.name }}</h4>
                <div class="form-grid">
                  <div class="form-column">
                    <div class="form-group">
                      <label :for="`modal-name-${lang.code}`">Translated Name</label>
                      <input type="text" :id="`modal-name-${lang.code}`" v-model="editingProduct.translations[lang.code].name" class="enhanced-input">
                    </div>
                    <div class="form-group">
                      <label :for="`modal-category-${lang.code}`">Translated Category</label>
                      <input type="text" :id="`modal-category-${lang.code}`" v-model="editingProduct.translations[lang.code].category" class="enhanced-input">
                    </div>
                    <div class="form-group">
                      <label :for="`modal-description-${lang.code}`">Translated Description</label>
                      <textarea :id="`modal-description-${lang.code}`" v-model="editingProduct.translations[lang.code].description" rows="4" class="enhanced-textarea"></textarea>
                    </div>
                  </div>
                  <div class="form-column">
                    <div class="form-group attributes-section translated-attributes">
                      <label>Translated Attributes ({{ lang.name }})</label>
                      <p v-if="editingProductAttributes.length === 0" class="no-attributes-message">Add base attributes first.</p>
                      <div v-else>
                        <div v-for="(baseAttr) in editingProductAttributes.filter(a => a.key)" :key="`edit-trans-attr-${lang.code}-${baseAttr.key}`" class="attribute-translation-row">
                          <div class="base-attribute-display">
                            <strong>{{ baseAttr.key }}:</strong> {{ baseAttr.value || '(No Value)' }}
                          </div>
                          <div class="translated-inputs">
                            <input type="text"
                                   v-model="editingProduct.translations[lang.code].attributes.keys[baseAttr.key]"
                                   :placeholder="`Translate Key: '${baseAttr.key}'`"
                                   class="enhanced-input attribute-key-translation">
                            <input type="text"
                                   v-model="editingProduct.translations[lang.code].attributes.values[baseAttr.key]"
                                   :placeholder="`Translate Values: '${baseAttr.value}'`"
                                   class="enhanced-input attribute-value-translation">
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p v-if="modalError" class="modal-error-text">{{ modalError }}</p>
          </div>
          <div class="modal-actions">
            <button type="button" class="button enhanced-button secondary" @click="closeModal">Cancel</button>
            <button type="submit" class="button enhanced-button primary" :disabled="isSaving">
              <font-awesome-icon icon="spinner" spin v-if="isSaving" />
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-container delete-modal">
        <div class="modal-header">
          <h2>Confirm Deletion</h2>
          <button class="close-modal-btn" @click="closeDeleteModal">×</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to permanently delete product <strong>"{{ productToDelete?.name }}"</strong>?</p>
          <p v-if="productToDelete?.productNumber">Product #: {{ productToDelete.productNumber }}</p>
          <p class="warning-text">This action cannot be undone and will also delete associated reviews.</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="button enhanced-button secondary" @click="closeDeleteModal">Cancel</button>
          <button type="button" class="button enhanced-button danger" @click="deleteProductConfirmed" :disabled="isDeleting">
            <font-awesome-icon icon="spinner" spin v-if="isDeleting" />
            {{ isDeleting ? 'Deleting...' : 'Yes, Delete Product' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
  import { ref, onMounted, computed, watch, reactive } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { debounce } from 'lodash-es';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  // Import SUPPORTED_LOCALES from main.js
  import { SUPPORTED_LOCALES } from '@/main.js'; // Adjust path if needed
  // Import icons... (ensure all needed icons are added as in AdminAddItem)
  import { library } from '@fortawesome/fontawesome-svg-core';
  import {
    faPlus, faEye, faEdit, faTrash, faTags, faLanguage, faTrashAlt, faFlagUsa,
    faSpinner, faCheckCircle, faListAlt, faChevronLeft, faTimesCircle
  } from '@fortawesome/free-solid-svg-icons';

  library.add(
    faPlus, faEye, faEdit, faTrash, faTags, faLanguage, faTrashAlt, faFlagUsa,
    faSpinner, faCheckCircle, faListAlt, faChevronLeft, faTimesCircle
  );


  // --- State ---
  const products = ref([]); // Raw list from API
  const filteredProducts = ref([]); // List after frontend filtering
  const loading = ref(true);
  const error = ref(null);
  const searchQuery = ref('');
  const categoryFilter = ref('');
  const statusFilter = ref(''); // '', 'true', 'false'
  const categories = ref([]);
  const currentPage = ref(1);
  const itemsPerPage = ref(10);
  const totalItems = ref(0);
  const totalPages = ref(1);

  // Modal States
  const showEditModal = ref(false);
  const isNewProduct = ref(false); // Always false in this component's context
  const isEditing = ref(false);    // Flag for modal state
  const isSaving = ref(false);
  const isDeleting = ref(false);
  const modalError = ref(null);
  const activeTranslationTab = ref(SUPPORTED_LOCALES.find(l => l.code !== 'en')?.code || null);

  // Use reactive for the product being edited
  const editingProduct = reactive({
    _id: null, productNumber: '', name: '', price: null, description: '',
    category: '', slug: '', enabled: true,
    translations: {} // Initialize dynamically in editProduct
  });
  // Separate refs for arrays within the reactive object
  const editingProductAttributes = ref([]); // Array of { key: string, value: string }
  const editingProductImages = ref(['']); // Array of strings


  const showDeleteModal = ref(false);
  const productToDelete = ref(null);

  const placeholderImage = `https://via.placeholder.com/60x60/cccccc/FFFFFF?text=N/A`;

  const route = useRoute();
  const router = useRouter();
  const supportedLocales = ref(SUPPORTED_LOCALES);

  // --- Computed Properties ---
  const modalTitle = computed(() => 'Edit Product'); // Always Edit in this component

  // Compute paginated products based on the filtered list
  const paginatedProducts = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredProducts.value.slice(start, end);
  });

  const hasActiveFilters = computed(() => {
    return searchQuery.value || categoryFilter.value || statusFilter.value !== '';
  });

  // --- Methods ---
  const isUrlValid = (url) => { // URL validation helper
    try { new URL(url); return url.startsWith('http'); } catch { return false; }
  };
  const formatCurrency = (amount) => `$${Number(amount || 0).toFixed(2)}`; // Handle potential null/undefined
  const slugify = (text) => { /* ... (same slugify function) ... */ };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products/categories'); // Use the correct endpoint
      if (!response.ok) throw new Error('Failed to fetch categories');
      categories.value = await response.json();
      console.log("Fetched categories for filter:", categories.value);
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Optionally set an error state for categories if needed
      categories.value = []; // Reset categories on error
    }
  };

  const fetchProducts = async () => {
    loading.value = true;
    error.value = null;
    try {
      // Fetch ALL products using the admin endpoint which includes translations
      const response = await fetch('/api/products/admin', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      // Store the raw data (including translations map)
      products.value = data.products || [];
      // Update categories based on the fetched products
      const categorySet = new Set(products.value.map(p => p.category).filter(Boolean));
      categories.value = Array.from(categorySet).sort();
      // Apply initial filters and pagination
      applyFiltersAndPagination();
    } catch (err) {
      console.error('Error fetching products:', err);
      error.value = 'Failed to load products. Please try again.';
      products.value = [];
      filteredProducts.value = []; // Ensure filtered is also empty
      totalItems.value = 0;
      totalPages.value = 1;
      currentPage.value = 1;
    } finally {
      loading.value = false;
    }
  };


  const applyFiltersAndPagination = () => {
    let tempFiltered = [...products.value];

    // Apply search query (case-insensitive on name, productNumber, category)
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase().trim();
      if (query) {
        tempFiltered = tempFiltered.filter(product =>
          product.name?.toLowerCase().includes(query) ||
          product.productNumber?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query)
        );
      }
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

    // Update filtered list ref
    filteredProducts.value = tempFiltered;

    // Update pagination totals based on the *filtered* results
    totalItems.value = filteredProducts.value.length;
    totalPages.value = Math.ceil(totalItems.value / itemsPerPage.value);

    // Clamp currentPage if it's out of bounds after filtering
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value || 1;
    }

    // Note: The actual slicing for display happens in the `paginatedProducts` computed property.
    // We don't slice `filteredProducts` here.

    updateURLQueryParams();
  };

  const debounceSearch = debounce(() => {
    currentPage.value = 1; // Reset page on search
    applyFiltersAndPagination();
  }, 400);

  const filterProducts = () => {
    currentPage.value = 1; // Reset page on filter change
    applyFiltersAndPagination();
  };

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages.value && !loading.value) {
      currentPage.value = page;
      updateURLQueryParams(); // Update URL when page changes
      // No need to call applyFiltersAndPagination, computed property handles slicing
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll top on page change
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
      router.replace({ name: route.name, query }).catch(err => { // Ensure name is included
        if (err.name !== 'NavigationDuplicated') { console.error('Router replace error:', err); }
      });
    }
  };

  const viewProduct = (product) => {
    router.push({ name: 'product-detail', params: { id: product._id } });
  };

  // Modal Methods (similar to AdminAddItem)
  const editProduct = (product) => {
    isNewProduct.value = false;
    isEditing.value = true;
    modalError.value = null;

    // Populate base fields directly into the reactive object
    editingProduct._id = product._id;
    editingProduct.productNumber = product.productNumber;
    editingProduct.name = product.name;
    editingProduct.price = product.price;
    editingProduct.description = product.description || '';
    editingProduct.category = product.category || '';
    editingProduct.slug = product.slug || '';
    editingProduct.enabled = product.enabled;
    // Populate array refs
    editingProductImages.value = product.images?.length ? [...product.images] : [''];

    // Populate base attributes ref (convert Map/Object to array)
    editingProductAttributes.value = [];
    if (product.attributes && typeof product.attributes === 'object') {
      const attributesSource = product.attributes instanceof Map ? product.attributes : Object.entries(product.attributes);
      for (const [key, value] of attributesSource) {
        editingProductAttributes.value.push({ key, value: Array.isArray(value) ? value.join(', ') : String(value) });
      }
    }

    // Populate translations into the reactive object
    editingProduct.translations = {}; // Reset first
    supportedLocales.value.forEach(lang => {
      if (lang.code !== 'en') {
        const transData = product.translations?.[lang.code] || product.translations?.get?.(lang.code);
        // Ensure structure exists within the reactive object
        editingProduct.translations[lang.code] = {
          name: transData?.name || '',
          description: transData?.description || '',
          category: transData?.category || '',
          attributes: { keys: {}, values: {} }
        };
        // Populate keys
        const transKeys = transData?.attributes?.keys || {};
        const keysSource = transKeys instanceof Map ? transKeys : Object.entries(transKeys);
        for (const [baseKey, translatedKey] of keysSource) {
          editingProduct.translations[lang.code].attributes.keys[baseKey] = translatedKey;
        }
        // Populate values
        const transValues = transData?.attributes?.values || {};
        const valuesSource = transValues instanceof Map ? transValues : Object.entries(transValues);
        for (const [baseKey, translatedValueArr] of valuesSource) {
          editingProduct.translations[lang.code].attributes.values[baseKey] = Array.isArray(translatedValueArr) ? translatedValueArr.join(', ') : String(translatedValueArr);
        }
      }
    });

    activeTranslationTab.value = supportedLocales.value.find(l => l.code !== 'en')?.code || null;
    showEditModal.value = true;
  };

  const closeModal = () => {
    showEditModal.value = false;
    // Reset reactive object and refs
    Object.assign(editingProduct, { _id: null, productNumber: '', name: '', price: null, description: '', category: '', slug: '', enabled: true, translations: {} });
    editingProductAttributes.value = [];
    editingProductImages.value = [''];
    modalError.value = null;
    activeTranslationTab.value = supportedLocales.value.find(l => l.code !== 'en')?.code || null;
  };

  const addAttribute = () => editingProductAttributes.value.push({ key: '', value: '' });
  const removeAttribute = (index) => {
    const removedKey = editingProductAttributes.value[index]?.key;
    editingProductAttributes.value.splice(index, 1);
    if (removedKey) {
      supportedLocales.value.forEach(lang => {
        if (lang.code !== 'en' && editingProduct.translations[lang.code]?.attributes) {
          delete editingProduct.translations[lang.code].attributes.keys?.[removedKey];
          delete editingProduct.translations[lang.code].attributes.values?.[removedKey];
        }
      });
    }
  };
  const addImage = () => editingProductImages.value.push('');
  const removeImage = (index) => {
    if (editingProductImages.value.length > 1) {
      editingProductImages.value.splice(index, 1);
    } else {
      editingProductImages.value[0] = '';
    }
  };

  // Save Product (Handles Edit only in this component)
  const saveProduct = async () => {
    if (!isEditing.value) return; // Should not happen here, but safeguard
    isSaving.value = true;
    modalError.value = null;

    try {
      // --- Validation ---
      if (!editingProduct.name || editingProduct.price === null || editingProduct.price < 0) {
        throw new Error("Product Name and a valid Price are required.");
      }
      const validImages = editingProductImages.value.filter(url => url && isUrlValid(url));
      if (validImages.length === 0) {
        throw new Error('Please provide at least one valid Image URL.');
      }
      const baseAttributeKeys = new Set();
      for (const attr of editingProductAttributes.value) {
        const key = attr.key?.trim();
        const value = attr.value?.trim();
        if ((key && !value) || (!key && value)) {
          throw new Error(`Base attribute '${key || value}' is incomplete.`);
        }
        if (key && baseAttributeKeys.has(key)) {
          throw new Error(`Duplicate base attribute name found: "${key}".`);
        }
        if (key) baseAttributeKeys.add(key);
      }

      // --- Prepare Payload ---
      const payload = {
        name: editingProduct.name.trim(),
        price: parseFloat(editingProduct.price),
        description: editingProduct.description?.trim() || '',
        category: editingProduct.category?.trim() || '',
        slug: editingProduct.slug?.trim() || '', // Don't auto-generate slug on edit unless name changed and slug is empty
        images: validImages,
        enabled: editingProduct.enabled,
        attributes: {}, // Base attributes object
        translations: {} // Translations object
      };

      // Process Base Attributes
      editingProductAttributes.value.forEach(attr => {
        const key = attr.key?.trim();
        const value = attr.value?.trim();
        if (key && value) {
          payload.attributes[key] = value.split(',').map(v => v.trim()).filter(Boolean);
        }
      });

      // Process Translations
      for (const langCode in editingProduct.translations) {
        const trans = editingProduct.translations[langCode];
        const payloadTrans = {};
        if (trans.name?.trim()) payloadTrans.name = trans.name.trim();
        if (trans.description?.trim()) payloadTrans.description = trans.description.trim();
        if (trans.category?.trim()) payloadTrans.category = trans.category.trim();

        const transAttrPayload = { keys: {}, values: {} };
        if (trans.attributes?.keys) {
          for (const baseKey in trans.attributes.keys) {
            const translatedKey = trans.attributes.keys[baseKey]?.trim();
            if (payload.attributes[baseKey] && translatedKey) {
              transAttrPayload.keys[baseKey] = translatedKey;
            }
          }
        }
        if (trans.attributes?.values) {
          for (const baseKey in trans.attributes.values) {
            const translatedValueString = trans.attributes.values[baseKey]?.trim();
            if (payload.attributes[baseKey] && translatedValueString) {
              transAttrPayload.values[baseKey] = translatedValueString.split(',').map(v => v.trim()).filter(Boolean);
            }
          }
        }

        if (Object.keys(transAttrPayload.keys).length > 0 || Object.keys(transAttrPayload.values).length > 0) {
          if (Object.keys(transAttrPayload.keys).length === 0) delete transAttrPayload.keys;
          if (Object.keys(transAttrPayload.values).length === 0) delete transAttrPayload.values;
          payloadTrans.attributes = transAttrPayload;
        }

        if (Object.keys(payloadTrans).length > 0) {
          payload.translations[langCode] = payloadTrans;
        }
      }
      if (Object.keys(payload.attributes).length === 0) delete payload.attributes;
      if (Object.keys(payload.translations).length === 0) delete payload.translations;

      console.log("Update Payload:", JSON.stringify(payload, null, 2));

      // --- API Call ---
      const url = `/api/products/${editingProduct._id}`;
      const method = 'PUT';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update product');
      }

      // Success
      await fetchProducts(); // Refetch list
      closeModal();
      alert('Product updated successfully!');

    } catch (err) {
      console.error('Error saving product:', err);
      modalError.value = err.message || 'An error occurred while saving.';
    } finally {
      isSaving.value = false;
    }
  };


  const toggleProductStatus = async (product) => { /* ... (same as before) ... */ };
  const confirmDeleteProduct = (product) => { /* ... (same as before) ... */ };
  const closeDeleteModal = () => { /* ... (same as before) ... */ };
  const deleteProductConfirmed = async () => { /* ... (same as before) ... */ };


  // --- Lifecycle Hooks ---
  onMounted(() => {
    // Read initial filters from URL (if desired)
    // const initialPage = readFiltersFromURL(); // You'd need to implement this if needed
    fetchProducts(currentPage.value); // Fetch initial list
    fetchCategories(); // Fetch categories for filter dropdown
  });

  // Watch route query changes (e.g., browser back/forward)
  // Optional: If you want filters to update based on URL changes
  /*
  watch(() => route.query, (newQuery) => {
    const needsRefetch =
      (newQuery.page || '1') !== String(currentPage.value) ||
      (newQuery.q || '') !== searchQuery.value ||
      (newQuery.category || '') !== categoryFilter.value ||
      (newQuery.status || '') !== statusFilter.value;

    if (needsRefetch) {
      currentPage.value = parseInt(newQuery.page) || 1;
      searchQuery.value = newQuery.q || '';
      categoryFilter.value = newQuery.category || '';
      statusFilter.value = newQuery.status || '';
      fetchProducts(currentPage.value); // Fetch with new params
    }
  }, { deep: true });
  */

</script>

<style scoped>
  /* Styles are mostly inherited from shared admin CSS */
  /* Add specific overrides or additions if necessary */

  .admin-products {
    width: 100%;
  }

  .search-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    align-items: flex-end;
  }

  .search-box {
    flex: 1 1 300px;
  }

  .filters {
    display: flex;
    gap: 1rem;
    flex: 1 1 auto;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    flex: 1 1 180px;
    gap: 0.5rem;
  }

  .image-cell img {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: var(--border-radius-small);
    border: 1px solid var(--border-color);
  }

  .status-cell {
    min-width: 160px;
  }

  .toggle-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .toggle-label {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-active {
    color: #388e3c;
  }

  .status-inactive {
    color: #d32f2f;
  }
  /* Toggle switch styles are in main.css */
  .actions-cell {
    white-space: nowrap;
    text-align: right;
  }

  .actions-header {
    text-align: right;
  }

  .action-btn {
    margin: 0 0.2rem;
  }
  /* Tighter spacing */

  /* Table Responsive Wrapper */
  .table-responsive-wrapper {
    width: 100%;
    overflow-x: auto; /* Allow horizontal scroll */
  }

  .users-data-table { /* Use a distinct class if needed, or target .data-table */
    min-width: 800px; /* Set a min-width to prevent excessive squeezing */
  }


  /* Modal Styles */
  .modal-body .form-section {
    border: none;
    padding: 0 0 1.5rem 0;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }

    .modal-body .form-section:last-of-type {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .modal-body .form-section h3 {
      font-size: 1.1rem;
      padding-bottom: 0.6rem;
      margin-bottom: 1rem;
    }

  .modal-body .attributes-section {
    background-color: var(--bg-off-light);
  }

  .modal-body .translated-attributes label {
    font-size: 0.95rem;
  }

  .modal-body .base-attribute-display {
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }

  .modal-body .attribute-translation-row {
    margin-bottom: 1rem;
    padding-bottom: 0.8rem;
  }

  .modal-error-text {
    color: var(--secondary);
    font-size: 0.85rem;
    margin-top: 1rem;
    text-align: center;
  }

  .delete-modal .modal-body p {
    text-align: center;
    margin-bottom: 0.75rem;
  }

  .delete-modal .modal-body strong {
    color: var(--text-dark);
  }

  /* Pagination */
  .users-pagination { /* Reuse class name for consistency or rename */
    margin-top: 1.5rem;
    justify-content: center;
  }

  .page-btn { /* Basic button styles */
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color);
    background-color: var(--white);
    border-radius: var(--border-radius-small);
    cursor: pointer;
    transition: all var(--transition-fast);
    color: var(--text-muted);
  }

    .page-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .page-btn:not(:disabled):hover {
      border-color: var(--primary);
      color: var(--primary);
    }

  .page-info {
    padding: 0.5rem 1rem;
    color: var(--text-muted);
    font-size: 0.9rem;
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
  }
</style>
