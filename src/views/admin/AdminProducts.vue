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
            <select id="admin-product-category" v-model="categoryFilter" @change="filterProducts" class="enhanced-input" :disabled="categoriesLoading">
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
          <div class="filter-group reset-group">
            <button @click="resetFilters" class="button enhanced-button secondary reset-btn" :disabled="loading || !hasActiveFilters">
              <font-awesome-icon icon="times-circle" /> Reset Filters
            </button>
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
          <table v-if="filteredProducts.length > 0" class="data-table users-data-table">
            <!-- Use consistent class name -->
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
                  <button class="action-btn view-btn" @click="viewProduct(product)" title="View Product">
                    <font-awesome-icon icon="eye" />
                    <span class="action-label">View</span>
                  </button>
                  <button class="action-btn edit-btn" @click="editProduct(product)" title="Edit Product">
                    <font-awesome-icon icon="edit" />
                    <span class="action-label">Edit</span>
                  </button>
                  <button class="action-btn delete-btn" @click="confirmDeleteProduct(product)" title="Delete Product">
                    <font-awesome-icon icon="trash" />
                    <span class="action-label">Delete</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filteredProducts.length === 0" class="empty-state">
          <p>No products found.</p>
          <p v-if="hasActiveFilters">Try adjusting your search or filters.</p>
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
  import { SUPPORTED_LOCALES } from '@/config/i18n.js';
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
  const products = ref([]);
  const filteredProducts = ref([]);
  const loading = ref(true);
  const error = ref(null);
  const searchQuery = ref('');
  const categoryFilter = ref('');
  const statusFilter = ref('');
  const categories = ref([]);
  const categoriesLoading = ref(false); // Added state for category loading
  const currentPage = ref(1);
  const itemsPerPage = ref(10);
  const totalItems = ref(0);
  const totalPages = ref(1);

  // Modal States
  const showEditModal = ref(false);
  const isNewProduct = ref(false);
  const isEditing = ref(false);
  const isSaving = ref(false);
  const isDeleting = ref(false);
  const modalError = ref(null);
  const activeTranslationTab = ref(SUPPORTED_LOCALES.find(l => l.code !== 'en')?.code || null);

  const editingProduct = reactive({
    _id: null, productNumber: '', name: '', price: null, description: '',
    category: '', slug: '', enabled: true,
    translations: {}
  });
  const editingProductAttributes = ref([]);
  const editingProductImages = ref(['']);

  const showDeleteModal = ref(false);
  const productToDelete = ref(null);

  const placeholderImage = `https://via.placeholder.com/60x60/cccccc/FFFFFF?text=N/A`;

  const route = useRoute();
  const router = useRouter();
  const supportedLocales = ref(SUPPORTED_LOCALES);

  // --- Computed Properties ---
  const modalTitle = computed(() => 'Edit Product');

  const paginatedProducts = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredProducts.value.slice(start, end);
  });

  const hasActiveFilters = computed(() => {
    return searchQuery.value || categoryFilter.value || statusFilter.value !== '';
  });

  // --- Methods ---
  const isUrlValid = (url) => {
    try { new URL(url); return url.startsWith('http'); } catch { return false; }
  };
  const formatCurrency = (amount) => `$${Number(amount || 0).toFixed(2)}`;
  const slugify = (text) => {
    if (!text) return '';
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  // *** ADDED fetchCategories function ***
  const fetchCategories = async () => {
    categoriesLoading.value = true;
    try {
      const response = await fetch('/api/products/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      categories.value = await response.json();
    } catch (error) {
      console.error("Error fetching categories:", error);
      categories.value = [];
    } finally {
      categoriesLoading.value = false;
    }
  };
  // *** END ADDED fetchCategories ***

  const fetchProducts = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch('/api/products/admin', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      products.value = data.products || [];
      applyFiltersAndPagination();
    } catch (err) {
      console.error('Error fetching products:', err);
      error.value = 'Failed to load products. Please try again.';
      products.value = [];
      filteredProducts.value = [];
      totalItems.value = 0;
      totalPages.value = 1;
      currentPage.value = 1;
    } finally {
      loading.value = false;
    }
  };

  const applyFiltersAndPagination = () => {
    let tempFiltered = [...products.value];

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

    if (categoryFilter.value) {
      tempFiltered = tempFiltered.filter(product => product.category === categoryFilter.value);
    }

    if (statusFilter.value !== '') {
      const enabled = statusFilter.value === 'true';
      tempFiltered = tempFiltered.filter(product => product.enabled === enabled);
    }

    filteredProducts.value = tempFiltered;
    totalItems.value = filteredProducts.value.length;
    totalPages.value = Math.ceil(totalItems.value / itemsPerPage.value);

    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value || 1;
    }
    updateURLQueryParams();
  };

  const debounceSearch = debounce(() => {
    currentPage.value = 1;
    applyFiltersAndPagination();
  }, 400);

  const filterProducts = () => {
    currentPage.value = 1;
    applyFiltersAndPagination();
  };

  const resetFilters = () => {
    if (loading.value) return;
    searchQuery.value = '';
    categoryFilter.value = '';
    statusFilter.value = '';
    filterProducts(); // This resets page and applies filters
  };

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages.value && !loading.value) {
      currentPage.value = page;
      updateURLQueryParams();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const updateURLQueryParams = () => {
    const query = {};
    if (currentPage.value > 1) query.page = currentPage.value;
    if (searchQuery.value) query.q = searchQuery.value;
    if (categoryFilter.value) query.category = categoryFilter.value;
    if (statusFilter.value !== '') query.status = statusFilter.value;

    if (JSON.stringify(query) !== JSON.stringify(route.query)) {
      router.replace({ name: route.name, query }).catch(err => {
        if (err.name !== 'NavigationDuplicated') { console.error('Router replace error:', err); }
      });
    }
  };

  const viewProduct = (product) => {
    router.push({ name: 'product-detail', params: { id: product._id } });
  };

  // Modal Methods
  const editProduct = (product) => {
    isNewProduct.value = false;
    isEditing.value = true;
    modalError.value = null;
    editingProduct._id = product._id;
    editingProduct.productNumber = product.productNumber;
    editingProduct.name = product.name;
    editingProduct.price = product.price;
    editingProduct.description = product.description || '';
    editingProduct.category = product.category || '';
    editingProduct.slug = product.slug || '';
    editingProduct.enabled = product.enabled;
    editingProductImages.value = product.images?.length ? [...product.images] : [''];

    editingProductAttributes.value = [];
    if (product.attributes && typeof product.attributes === 'object') {
      const attributesSource = product.attributes instanceof Map ? product.attributes : Object.entries(product.attributes);
      for (const [key, value] of attributesSource) {
        editingProductAttributes.value.push({ key, value: Array.isArray(value) ? value.join(', ') : String(value || '') });
      }
    }

    editingProduct.translations = {};
    supportedLocales.value.forEach(lang => {
      if (lang.code !== 'en') {
        const transData = product.translations?.[lang.code] || product.translations?.get?.(lang.code);
        editingProduct.translations[lang.code] = {
          name: transData?.name || '',
          description: transData?.description || '',
          category: transData?.category || '',
          attributes: { keys: {}, values: {} }
        };
        const transKeys = transData?.attributes?.keys || {};
        const keysSource = transKeys instanceof Map ? transKeys : Object.entries(transKeys);
        for (const [baseKey, translatedKey] of keysSource) {
          editingProduct.translations[lang.code].attributes.keys[baseKey] = translatedKey;
        }
        const transValues = transData?.attributes?.values || {};
        const valuesSource = transValues instanceof Map ? transValues : Object.entries(transValues);
        for (const [baseKey, translatedValueArr] of valuesSource) {
          editingProduct.translations[lang.code].attributes.values[baseKey] = Array.isArray(translatedValueArr) ? translatedValueArr.join(', ') : String(translatedValueArr || '');
        }
      }
    });

    activeTranslationTab.value = supportedLocales.value.find(l => l.code !== 'en')?.code || null;
    showEditModal.value = true;
  };


  const closeModal = () => {
    showEditModal.value = false;
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

  const saveProduct = async () => {
    if (!isEditing.value) return;
    isSaving.value = true;
    modalError.value = null;

    try {
      if (!editingProduct.name || editingProduct.price === null || editingProduct.price < 0) {
        throw new Error("Product Name and a valid Price are required.");
      }
      const validImages = editingProductImages.value.filter(url => url && isUrlValid(url));
      if (validImages.length === 0) {
        throw new Error('Please provide at least one valid Image URL.');
      }
      const baseAttributeKeys = new Set();
      for (const attr of editingProductAttributes.value) {
        const key = attr.key?.trim(); const value = attr.value?.trim();
        if ((key && !value) || (!key && value)) throw new Error(`Base attribute '${key || value}' is incomplete.`);
        if (key && baseAttributeKeys.has(key)) throw new Error(`Duplicate base attribute name found: "${key}".`);
        if (key) baseAttributeKeys.add(key);
      }

      const payload = {
        name: editingProduct.name.trim(), price: parseFloat(editingProduct.price),
        description: editingProduct.description?.trim() || '', category: editingProduct.category?.trim() || '',
        slug: editingProduct.slug?.trim() || slugify(editingProduct.name.trim()), // Generate if empty/changed
        images: validImages, enabled: editingProduct.enabled,
        attributes: {}, translations: {}
      };

      editingProductAttributes.value.forEach(attr => {
        const key = attr.key?.trim(); const value = attr.value?.trim();
        if (key && value) payload.attributes[key] = value.split(',').map(v => v.trim()).filter(Boolean);
      });

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
            if (payload.attributes[baseKey] && translatedKey) transAttrPayload.keys[baseKey] = translatedKey;
          }
        }
        if (trans.attributes?.values) {
          for (const baseKey in trans.attributes.values) {
            const translatedValueString = trans.attributes.values[baseKey]?.trim();
            if (payload.attributes[baseKey] && translatedValueString) transAttrPayload.values[baseKey] = translatedValueString.split(',').map(v => v.trim()).filter(Boolean);
          }
        }
        if (Object.keys(transAttrPayload.keys).length > 0 || Object.keys(transAttrPayload.values).length > 0) {
          if (Object.keys(transAttrPayload.keys).length === 0) delete transAttrPayload.keys;
          if (Object.keys(transAttrPayload.values).length === 0) delete transAttrPayload.values;
          payloadTrans.attributes = transAttrPayload;
        }
        if (Object.keys(payloadTrans).length > 0) payload.translations[langCode] = payloadTrans;
      }
      if (Object.keys(payload.attributes).length === 0) delete payload.attributes;
      if (Object.keys(payload.translations).length === 0) delete payload.translations;

      const url = `/api/products/${editingProduct._id}`;
      const method = 'PUT';
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update product');
      }
      await fetchProducts();
      closeModal();
      alert('Product updated successfully!');
    } catch (err) {
      console.error('Error saving product:', err);
      modalError.value = err.message || 'An error occurred while saving.';
    } finally {
      isSaving.value = false;
    }
  };

  // *** IMPLEMENTED toggleProductStatus ***
  const toggleProductStatus = async (product) => {
    const originalStatus = product.enabled;
    const newStatus = !originalStatus;
    product.enabled = newStatus; // Optimistic update

    try {
      const response = await fetch(`/api/products/${product._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled: newStatus })
      });

      if (!response.ok) {
        product.enabled = originalStatus; // Revert on error
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to update status: ${errorData.message || response.statusText}`);
      } else {
        // Optionally refetch or confirm update if needed
        console.log(`Product ${product._id} status updated to ${newStatus}`);
      }
    } catch (err) {
      product.enabled = originalStatus; // Revert on network error
      console.error(`Error toggling status for product ${product._id}:`, err);
      alert('An error occurred while updating product status.');
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

  // *** IMPLEMENTED deleteProductConfirmed ***
  const deleteProductConfirmed = async () => {
    if (!productToDelete.value) return;
    isDeleting.value = true;
    error.value = null; // Clear main page error

    try {
      const response = await fetch(`/api/products/${productToDelete.value._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status} - Failed to delete product`);
      }

      // Success: Remove from local list and refilter/paginate
      products.value = products.value.filter(p => p._id !== productToDelete.value._id);
      applyFiltersAndPagination();
      alert(`Product "${productToDelete.value.name}" deleted successfully.`);
      closeDeleteModal();

    } catch (err) {
      console.error('Error deleting product:', err);
      error.value = err.message; // Show error on main page
      alert(`Error: ${error.value}`); // Show error to user
      closeDeleteModal(); // Close modal even on error
    } finally {
      isDeleting.value = false;
    }
  };

  // --- Lifecycle Hooks ---
  onMounted(() => {
    fetchProducts(); // Fetch initial list
    fetchCategories(); // Fetch categories for filter dropdown
  });

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
    flex: 1 1 300px; /* Allow search box to grow more */
  }

  .filters {
    display: flex;
    gap: 1rem;
    flex: 1 1 auto; /* Take remaining space */
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    flex: 1 1 180px; /* Base size for filters */
    min-width: 150px; /* Prevent too much shrinking */
    gap: 0.5rem;
  }

  .reset-group {
    flex-basis: auto; /* Allow button to size naturally */
    flex-grow: 0;
    flex-shrink: 0;
  }

  .reset-btn {
    width: auto; /* Fit content */
    min-width: 120px;
  }

    .reset-btn svg {
      margin-right: 0.4em;
    }


  .image-cell img {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: var(--border-radius-small);
    border: 1px solid var(--border-color);
    vertical-align: middle; /* Align image nicely */
  }

  .status-cell {
    min-width: 160px;
  }

  .toggle-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    justify-content: center; /* Center toggle in cell */
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

  /* Toggle switch base styles - assuming these are in main.css */
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 44px; /* Adjust size */
    height: 24px;
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
    background-color: #ccc;
    transition: .4s;
    border-radius: 24px;
  }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }

  input:checked + .toggle-slider {
    background-color: var(--primary);
  }

  input:focus + .toggle-slider {
    box-shadow: 0 0 1px var(--primary);
  }

  input:checked + .toggle-slider:before {
    transform: translateX(20px);
  }


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

  /* Action Labels (optional, shown on wider screens) */
  .action-label {
    display: none; /* Hide by default */
    margin-left: 0.4em;
  }

  @media (min-width: 768px) {
    .action-label {
      display: inline; /* Show on medium screens and up */
    }
  }

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

  /* Additional Modal Preview Styles */
  .image-preview-container {
    margin-top: 1rem;
  }

  .previews-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .image-preview {
    text-align: center;
    width: 60px;
  }

  .preview-image {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border: 1px solid var(--border-color);
    border-radius: 4px;
  }

  .preview-placeholder {
    width: 60px;
    height: 60px;
    background: #eee;
    color: #aaa;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8em;
    border-radius: 4px;
  }

  .image-number {
    font-size: 0.7rem;
    color: #666;
    display: block;
    margin-top: 2px;
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
