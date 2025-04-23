<template>
  <div class="admin-add-item">
    <div class="admin-page-header">
      <h1>{{ isEditing ? 'Edit Product' : 'Add New Product' }}</h1>
      <router-link v-if="isEditing" :to="{ name: 'AdminProducts' }" class="button enhanced-button secondary">
        <font-awesome-icon icon="chevron-left" /> Back to Products
      </router-link>
    </div>

    <!-- Success Message Panel -->
    <div v-if="successMessage" class="admin-panel success-panel">
      <div class="success-content">
        <font-awesome-icon icon="check-circle" class="success-icon" />
        <h3>{{ successTitle }}</h3>
        <p v-if="createdProductNumber">Product Number: <strong>{{ createdProductNumber }}</strong></p>
        <p v-else-if="createdProductId">Product ID: <strong>{{ createdProductId }}</strong></p>
        <p>{{ successMessage }}</p>
        <div class="success-actions">
          <button @click="viewProduct" class="button enhanced-button secondary" v-if="createdProductId">
            <font-awesome-icon icon="eye" /> View Product
          </button>
          <button @click="resetFormForAdd" class="button enhanced-button primary">
            <font-awesome-icon icon="plus" /> Add Another Product
          </button>
          <router-link :to="{ name: 'AdminProducts' }" class="button enhanced-button secondary">
            <font-awesome-icon icon="list-alt" /> View All Products
          </router-link>
        </div>
      </div>
    </div>

    <!-- Main Content: Form & Preview -->
    <div v-if="!successMessage" class="add-item-layout">
      <!-- Form Panel -->
      <div class="admin-panel form-panel">
        <form @submit.prevent="handleSubmit" id="product-form">

          <!-- === Core English Fields === -->
          <div class="form-section">
            <h3><font-awesome-icon icon="flag-usa" /> Base (English) Details</h3>
            <div class="form-grid">
              <div class="form-column">
                <div class="form-group">
                  <label for="name">Product Name <span class="required">*</span></label>
                  <input type="text" id="name" v-model="formData.name" class="enhanced-input" required>
                </div>
                <div class="form-group">
                  <label for="price">Price ($) <span class="required">*</span></label>
                  <input type="number" id="price" v-model.number="formData.price" min="0" step="0.01" class="enhanced-input" required>
                </div>
                <div class="form-group">
                  <label for="category">Category</label>
                  <input type="text" id="category" v-model="formData.category" class="enhanced-input" list="category-suggestions-add">
                  <datalist id="category-suggestions-add">
                    <option v-for="cat in categories" :key="`cat-add-${cat}`" :value="cat"></option>
                  </datalist>
                </div>
                <div class="form-group">
                  <label for="productNumber">Product Number</label>
                  <input type="text" id="productNumber" v-model="formData.productNumber" class="enhanced-input" :readonly="!isNewProduct" :disabled="!isNewProduct" placeholder="Auto-generated on add">
                </div>
              </div>
              <div class="form-column">
                <div class="form-group">
                  <label for="description">Description</label>
                  <textarea id="description" v-model="formData.description" rows="5" class="enhanced-textarea"></textarea>
                </div>
                <div class="form-group">
                  <label for="slug">URL Slug (Optional)</label>
                  <input type="text" id="slug" v-model="formData.slug" class="enhanced-input" placeholder="Auto-generated from name if blank">
                </div>
                <div class="form-group checkbox-group">
                  <input type="checkbox" id="enabled" v-model="formData.enabled" />
                  <label for="enabled">Product Enabled</label>
                </div>
              </div>
            </div>
          </div>

          <!-- === English Attributes & Images === -->
          <div class="form-section">
            <h3><font-awesome-icon icon="tags" /> Base Attributes & Images</h3>
            <div class="form-grid">
              <div class="form-column">
                <!-- Base Attributes -->
                <div class="form-group attributes-section">
                  <label>Attributes (English)</label>
                  <div v-if="formData.attributes.length === 0" class="no-attributes-message">No base attributes added.</div>
                  <div v-for="(attr, index) in formData.attributes" :key="`base-attr-${index}`" class="attribute-row">
                    <input type="text" v-model="attr.key" placeholder="Attribute Name (e.g., Color)" class="enhanced-input attribute-input">
                    <input type="text" v-model="attr.value" placeholder="Value(s), comma-separated (e.g., Red, Blue)" class="enhanced-input attribute-input">
                    <button type="button" @click="removeAttribute('base', index)" class="action-btn delete-btn attribute-remove-btn" title="Remove Attribute">
                      <font-awesome-icon icon="trash-alt" />
                    </button>
                  </div>
                  <button type="button" @click="addAttribute('base')" class="button enhanced-button secondary add-attribute-btn">
                    <font-awesome-icon icon="plus" /> Add Base Attribute
                  </button>
                </div>
              </div>
              <div class="form-column">
                <!-- Images (Modified for Upload) -->
                <div class="form-group images-section">
                  <label>Product Images <span class="required">*</span></label>
                  <div v-for="(imageUrl, index) in formData.images" :key="`img-slot-${index}`" class="image-upload-row">
                    <!-- Hidden File Input Triggered by Label -->
                    <input type="file"
                           :id="`image-input-${index}`"
                           @change="handleFileChange($event, index)"
                           accept="image/jpeg, image/png, image/webp, image/gif"
                           style="display: none;">
                    <div class="image-preview-area">
                      <!-- Existing Image or Uploaded Image Preview -->
                      <img v-if="imageUrl && isUrlValid(imageUrl)" :src="imageUrl" :alt="`Product Image ${index + 1}`" class="image-preview-img">
                      <!-- Local Preview -->
                      <img v-else-if="localPreviews[index]" :src="localPreviews[index]" alt="Local Preview" class="image-preview-img">
                      <!-- Uploading State -->
                      <div v-else-if="uploadStatus[index] === 'uploading'" class="image-status-overlay uploading">
                        <font-awesome-icon icon="spinner" spin />
                        <span>Uploading...</span>
                      </div>
                      <!-- Error State -->
                      <div v-else-if="uploadStatus[index] === 'error'" class="image-status-overlay error">
                        <font-awesome-icon icon="times-circle" />
                        <span>Error</span>
                      </div>
                      <!-- Empty State / Upload Trigger -->
                      <label v-else :for="`image-input-${index}`" class="image-upload-trigger">
                        <font-awesome-icon icon="camera" />
                        <span>{{ index === 0 ? 'Add Main Image' : 'Add Image' }}</span>
                      </label>
                    </div>
                    <div class="image-controls">
                      <span class="image-label">{{ index === 0 ? 'Main Image' : `Image ${index + 1}` }}</span>
                      <button type="button"
                              @click="removeImage(index)"
                              class="action-btn delete-btn image-remove-btn"
                              :disabled="!canRemoveImage(index)"
                              title="Remove Image">
                        <font-awesome-icon icon="trash-alt" />
                      </button>
                      <div v-if="uploadErrors[index]" class="upload-error-text">
                        {{ uploadErrors[index] }}
                      </div>
                    </div>
                  </div>
                  <button type="button" @click="addImage" class="button enhanced-button secondary add-image-btn">
                    <font-awesome-icon icon="plus" /> Add Another Image
                  </button>
                  <p class="help-text">Upload JPEG, PNG, WEBP, or GIF images. Max 5MB per image.</p>
                </div>
              </div>
            </div>
          </div>


          <!-- === Translations Section === -->
          <div class="form-section translations-section">
            <h3><font-awesome-icon icon="language" /> Translations (Optional)</h3>
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
                 :key="lang.code"
                 v-show="activeTranslationTab === lang.code"
                 class="translation-pane">

              <h4>Editing: {{ lang.name }}</h4>

              <div class="form-grid">
                <!-- Translated Name, Category, Description -->
                <div class="form-column">
                  <div class="form-group">
                    <label :for="`name-${lang.code}`">Translated Name</label>
                    <input type="text" :id="`name-${lang.code}`" v-model="formData.translations[lang.code].name" class="enhanced-input">
                  </div>
                  <div class="form-group">
                    <label :for="`category-${lang.code}`">Translated Category</label>
                    <input type="text" :id="`category-${lang.code}`" v-model="formData.translations[lang.code].category" class="enhanced-input">
                  </div>
                  <div class="form-group">
                    <label :for="`description-${lang.code}`">Translated Description</label>
                    <textarea :id="`description-${lang.code}`" v-model="formData.translations[lang.code].description" rows="5" class="enhanced-textarea"></textarea>
                  </div>
                </div>

                <!-- Translated Attributes -->
                <div class="form-column">
                  <div class="form-group attributes-section translated-attributes">
                    <label>Translated Attributes ({{ lang.name }})</label>
                    <p v-if="formData.attributes.length === 0" class="no-attributes-message">Add base attributes first to translate them.</p>
                    <div v-else>
                      <div v-for="(baseAttr, index) in formData.attributes" :key="`trans-attr-${lang.code}-${index}`" class="attribute-translation-row">
                        <div class="base-attribute-display">
                          <strong>{{ baseAttr.key || '(No Name)' }}:</strong> {{ baseAttr.value || '(No Value)' }}
                        </div>
                        <div class="translated-inputs">
                          <input type="text"
                                 v-model="formData.translations[lang.code].attributes.keys[baseAttr.key]"
                                 :placeholder="`Translate Key: '${baseAttr.key}'`"
                                 class="enhanced-input attribute-key-translation">
                          <input type="text"
                                 v-model="formData.translations[lang.code].attributes.values[baseAttr.key]"
                                 :placeholder="`Translate Values: '${baseAttr.value}' (comma-sep)`"
                                 class="enhanced-input attribute-value-translation">
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <span v-if="errorMessage" class="error-message">{{ errorMessage }}</span>
            <router-link :to="{ name: 'AdminProducts' }" class="button enhanced-button secondary cancel-btn">
              Cancel
            </router-link>
            <button type="submit" class="button enhanced-button primary save-btn" :disabled="isSubmitting || isAnyImageUploading">
              <font-awesome-icon icon="spinner" spin v-if="isSubmitting || isAnyImageUploading" />
              <font-awesome-icon icon="save" v-else />
              {{ isSubmitting ? 'Saving...' : (isAnyImageUploading ? 'Uploading...' : (isEditing ? 'Update Product' : 'Add Product')) }}
            </button>
          </div>
        </form>
      </div>

      <!-- Preview Panel -->
      <div class="admin-panel preview-panel">
        <h2 class="panel-title">Preview ({{ activePreviewLangName }})</h2>
        <div class="preview-language-selector">
          <label for="preview-lang">Preview Language:</label>
          <select id="preview-lang" v-model="activePreviewLang" class="enhanced-input small">
            <option v-for="lang in supportedLocales" :key="`prev-${lang.code}`" :value="lang.code">
              {{ lang.name }}
            </option>
          </select>
        </div>
        <div class="preview-content">
          <!-- Image Previews (Uses same logic as form preview) -->
          <div class="image-preview-container">
            <label>Image Previews</label>
            <div class="preview-list">
              <div v-for="(imageUrl, index) in formData.images" :key="`live-preview-${index}`" class="image-preview">
                <img v-if="imageUrl && isUrlValid(imageUrl)" :src="imageUrl" :alt="`Preview ${index + 1}`" class="preview-image">
                <img v-else-if="localPreviews[index]" :src="localPreviews[index]" alt="Local Preview" class="preview-image">
                <div v-else-if="uploadStatus[index] === 'uploading'" class="preview-placeholder uploading-preview">
                  <font-awesome-icon icon="spinner" spin />
                </div>
                <div v-else-if="uploadStatus[index] === 'error'" class="preview-placeholder error-preview">
                  <font-awesome-icon icon="times-circle" />
                </div>
                <div v-else class="preview-placeholder">
                  <font-awesome-icon icon="image" />
                </div>
                <span class="image-number">{{ index === 0 ? 'Main' : `Img ${index + 1}` }}</span>
              </div>
              <!-- Add placeholders if fewer images than slots? Optional -->
            </div>
          </div>
          <hr class="preview-divider">
          <!-- Info Preview -->
          <div class="preview-info">
            <h4 class="preview-name">{{ getPreviewField('name') || 'Product Name' }}</h4>
            <p class="preview-price">${{ (formData.price || 0).toFixed(2) }}</p>
            <p class="preview-category" v-if="getPreviewField('category')">Category: {{ getPreviewField('category') }}</p>
            <p class="preview-description">{{ getPreviewField('description') || 'Product description will appear here...' }}</p>
            <!-- Attributes Preview -->
            <div v-if="formData.attributes.length > 0" class="preview-attributes">
              <strong>Attributes (Preview: {{ activePreviewLangName }}):</strong>
              <ul>
                <li v-for="(attr, index) in formData.attributes" :key="`prev-attr-${index}`">
                  <span v-if="attr.key">
                    <strong>{{ getPreviewAttributeKey(attr.key) }}:</strong>
                    {{ getPreviewAttributeValue(attr.key, attr.value) }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed, reactive, watch, onUnmounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { SUPPORTED_LOCALES } from '@/config/i18n.js';
  import { library } from '@fortawesome/fontawesome-svg-core';
  import {
    faPlusCircle, faPlus, faTrashAlt, faImage, faSave, faSpinner,
    faCheckCircle, faEye, faListAlt, faChevronLeft, faTags, faLanguage, faFlagUsa,
    faTimesCircle, faCamera // <-- Added faCamera, faTimesCircle
  } from '@fortawesome/free-solid-svg-icons';

  library.add(
    faPlusCircle, faPlus, faTrashAlt, faImage, faSave, faSpinner,
    faCheckCircle, faEye, faListAlt, faChevronLeft, faTags, faLanguage, faFlagUsa,
    faTimesCircle, faCamera // <-- Added faCamera, faTimesCircle
  );


  const router = useRouter();
  const route = useRoute();
  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  // --- Helper: Slugify ---
  const slugify = (text) => {
    if (!text) return '';
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  // --- Helper: Validate URL ---
  const isUrlValid = (url) => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch (_) {
      return false;
    }
  };

  // --- State ---
  const isSubmitting = ref(false);
  const errorMessage = ref('');
  const successMessage = ref('');
  const successTitle = ref('');
  const createdProductId = ref(null);
  const createdProductNumber = ref('');
  const categories = ref([]);
  const isNewProduct = ref(!route.params.id);
  const isEditing = computed(() => !isNewProduct.value);
  const productIdToEdit = ref(route.params.id || null);

  // Image Upload State
  const uploadStatus = ref({}); // { index: 'uploading' | 'error' | 'success' }
  const uploadErrors = ref({}); // { index: 'Error message' }
  const localPreviews = ref({}); // { index: 'blob:...' }

  // --- Form Data ---
  const initialFormDataState = () => ({
    _id: null,
    productNumber: '',
    name: '',
    price: null,
    description: '',
    category: '',
    slug: '',
    attributes: [],
    images: [''], // Start with one empty slot for the main image
    enabled: true,
    translations: {}
  });

  const formData = reactive(initialFormDataState());

  const initializeTranslations = () => {
    formData.translations = {};
    SUPPORTED_LOCALES.forEach(lang => {
      if (lang.code !== 'en') {
        formData.translations[lang.code] = {
          name: '', description: '', category: '',
          attributes: { keys: {}, values: {} }
        };
      }
    });
  }
  initializeTranslations();

  // --- UI State ---
  const supportedLocales = ref(SUPPORTED_LOCALES);
  const activeTranslationTab = ref(supportedLocales.value.find(l => l.code !== 'en')?.code || null);
  const activePreviewLang = ref('en');

  // --- Computed ---
  const activePreviewLangName = computed(() => {
    return supportedLocales.value.find(l => l.code === activePreviewLang.value)?.name || 'English';
  });

  // Computed property to check if any image is currently uploading
  const isAnyImageUploading = computed(() => {
    return Object.values(uploadStatus.value).some(status => status === 'uploading');
  });

  // Computed property to check if an image can be removed
  const canRemoveImage = (index) => {
    // Count how many slots have a URL or a local preview or are currently uploading
    const filledSlots = formData.images.reduce((count, url, i) => {
      return count + ((url || localPreviews.value[i] || uploadStatus.value[i] === 'uploading') ? 1 : 0);
    }, 0);
    // Allow removal if there's more than one filled slot, OR if it's the only slot but it's filled (to allow clearing it)
    return filledSlots > 1 || (filledSlots === 1 && (formData.images[index] || localPreviews.value[index] || uploadStatus.value[index] === 'uploading'));
  };


  // --- Methods ---
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      categories.value = await response.json();
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Reset image upload states
  const resetImageStates = () => {
    // Revoke any existing blob URLs first
    Object.values(localPreviews.value).forEach(URL.revokeObjectURL);
    uploadStatus.value = {};
    uploadErrors.value = {};
    localPreviews.value = {};
  };

  const addImage = () => {
    formData.images.push(''); // Add an empty slot
  };

  // Modified removeImage: Clears the slot instead of splicing
  const removeImage = (index) => {
    // Revoke local preview URL if it exists
    if (localPreviews.value[index]) {
      URL.revokeObjectURL(localPreviews.value[index]);
    }
    // Clear state for this index
    delete uploadStatus.value[index];
    delete uploadErrors.value[index];
    delete localPreviews.value[index];

    // Set the image URL to empty string
    formData.images[index] = '';

    // Optional: If this makes all slots empty, ensure at least one empty slot remains
    const hasAnyImage = formData.images.some(url => url !== '');
    if (!hasAnyImage && formData.images.length > 1) {
      // If removing the last actual image leaves multiple empty slots,
      // reduce to just one empty slot.
      formData.images = [''];
      resetImageStates(); // Reset all states as indices are gone
    } else if (!hasAnyImage && formData.images.length === 0) {
      // Ensure there's always at least one slot if all were removed somehow
      formData.images = [''];
    }
  };

  const handleFileChange = (event, index) => {
    const file = event.target.files[0];
    event.target.value = null; // Allow selecting the same file again

    if (!file) return;

    // Clear previous errors/status for this slot
    delete uploadErrors.value[index];
    uploadStatus.value[index] = '';
    formData.images[index] = ''; // Clear any previous URL

    // Revoke previous local preview if exists
    if (localPreviews.value[index]) {
      URL.revokeObjectURL(localPreviews.value[index]);
      delete localPreviews.value[index];
    }

    // --- Validation ---
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      uploadStatus.value[index] = 'error';
      uploadErrors.value[index] = 'Invalid file type. Use JPEG, PNG, GIF, WEBP.';
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      uploadStatus.value[index] = 'error';
      uploadErrors.value[index] = `File too large (Max ${MAX_FILE_SIZE_MB}MB).`;
      return;
    }

    // --- Set loading state and create local preview ---
    uploadStatus.value[index] = 'uploading';
    localPreviews.value[index] = URL.createObjectURL(file);

    // --- Start upload ---
    uploadImage(file, index);
  };

  const uploadImage = async (file, index) => {
    const body = new FormData();
    body.append('imageFile', file); // Key 'imageFile' MUST match backend (e.g., multer fieldname)

    try {
      const response = await fetch('/api/upload/image', { // The new backend endpoint
        method: 'POST',
        body: body,
        // No 'Content-Type' header needed for FormData, browser sets it with boundary
        credentials: 'include', // If authentication is needed for upload endpoint
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || 'Upload failed.');
      }

      // --- Success ---
      formData.images[index] = responseData.imageUrl; // Store the final URL
      uploadStatus.value[index] = 'success'; // Or just clear status: delete uploadStatus.value[index]
      // Clean up local preview now that we have the real URL
      if (localPreviews.value[index]) {
        URL.revokeObjectURL(localPreviews.value[index]);
        delete localPreviews.value[index];
      }

    } catch (error) {
      console.error(`Error uploading image at index ${index}:`, error);
      uploadStatus.value[index] = 'error';
      uploadErrors.value[index] = error.message || 'Upload failed. Please try again.';
      // Keep local preview on error? Or clear it? Let's clear it for consistency.
      if (localPreviews.value[index]) {
        URL.revokeObjectURL(localPreviews.value[index]);
        delete localPreviews.value[index];
      }
      formData.images[index] = ''; // Ensure URL is cleared on error
    } finally {
      // If status is still 'uploading' after try/catch (e.g., network error), mark as error
      if (uploadStatus.value[index] === 'uploading') {
        uploadStatus.value[index] = 'error';
        uploadErrors.value[index] = uploadErrors.value[index] || 'Network error during upload.';
        if (localPreviews.value[index]) {
          URL.revokeObjectURL(localPreviews.value[index]);
          delete localPreviews.value[index];
        }
        formData.images[index] = '';
      }
    }
  };

  const resetFormForAdd = () => {
    successMessage.value = '';
    createdProductId.value = null;
    createdProductNumber.value = '';
    errorMessage.value = '';
    Object.assign(formData, initialFormDataState());
    resetImageStates(); // Clear image statuses
    initializeTranslations();
    activeTranslationTab.value = supportedLocales.value.find(l => l.code !== 'en')?.code || null;
    activePreviewLang.value = 'en';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const viewProduct = () => {
    if (!createdProductId.value) return;
    const productUrl = router.resolve({ name: 'product-detail', params: { id: createdProductId.value } }).href;
    window.open(productUrl, '_blank');
  };

  const addAttribute = (type) => {
    if (type === 'base') {
      formData.attributes.push({ key: '', value: '' });
    }
  };

  const removeAttribute = (type, index) => {
    if (type === 'base') {
      const removedKey = formData.attributes[index]?.key;
      formData.attributes.splice(index, 1);
      if (removedKey) {
        SUPPORTED_LOCALES.forEach(lang => {
          if (lang.code !== 'en' && formData.translations[lang.code]) {
            if (formData.translations[lang.code].attributes.keys) {
              delete formData.translations[lang.code].attributes.keys[removedKey];
            }
            if (formData.translations[lang.code].attributes.values) {
              delete formData.translations[lang.code].attributes.values[removedKey];
            }
          }
        });
      }
    }
  };

  // --- Preview Helpers ---
  const getPreviewField = (field) => {
    if (activePreviewLang.value === 'en') {
      return formData[field];
    }
    return formData.translations?.[activePreviewLang.value]?.[field] || formData[field];
  };

  const getPreviewAttributeKey = (baseKey) => {
    if (activePreviewLang.value === 'en' || !baseKey) return baseKey;
    return formData.translations?.[activePreviewLang.value]?.attributes?.keys?.[baseKey] || baseKey;
  };

  const getPreviewAttributeValue = (baseKey, baseValue) => {
    if (activePreviewLang.value === 'en' || !baseKey) return baseValue;
    return formData.translations?.[activePreviewLang.value]?.attributes?.values?.[baseKey] || baseValue;
  };

  // --- Fetch Product for Editing ---
  const fetchProductForEditing = async (id) => {
    console.log(`Fetching product ${id} for editing...`);
    isSubmitting.value = true;
    errorMessage.value = '';
    resetImageStates(); // Clear any previous upload states before fetching

    try {
      const response = await fetch(`/api/products/admin/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch product data (Status: ${response.status})`);
      }
      const productData = await response.json();

      // Populate base fields
      formData._id = productData._id;
      formData.productNumber = productData.productNumber;
      formData.name = productData.name;
      formData.price = productData.price;
      formData.description = productData.description || '';
      formData.category = productData.category || '';
      formData.slug = productData.slug || '';
      formData.enabled = productData.enabled;
      // Ensure there's at least one slot, even if images array is empty/null
      formData.images = productData.images?.length ? [...productData.images] : [''];

      // Populate base attributes
      formData.attributes = [];
      if (productData.attributes && typeof productData.attributes === 'object') {
        const attributesSource = productData.attributes instanceof Map ? productData.attributes : Object.entries(productData.attributes);
        for (const [key, value] of attributesSource) {
          const valueString = Array.isArray(value) ? value.join(', ') : String(value || '');
          formData.attributes.push({ key, value: valueString });
        }
      }

      // Populate translations
      initializeTranslations();
      if (productData.translations && typeof productData.translations === 'object') {
        const translationsSource = productData.translations instanceof Map ? productData.translations : Object.entries(productData.translations);
        for (const [langCode, transData] of translationsSource) {
          if (formData.translations[langCode]) {
            formData.translations[langCode].name = transData.name || '';
            formData.translations[langCode].description = transData.description || '';
            formData.translations[langCode].category = transData.category || '';

            const transAttrKeys = transData.attributes?.keys || {};
            const transAttrValues = transData.attributes?.values || {};
            const keysSource = transAttrKeys instanceof Map ? transAttrKeys : Object.entries(transAttrKeys);
            for (const [baseKey, translatedKey] of keysSource) {
              formData.translations[langCode].attributes.keys[baseKey] = translatedKey;
            }
            const valuesSource = transAttrValues instanceof Map ? transAttrValues : Object.entries(transAttrValues);
            for (const [baseKey, translatedValueArr] of valuesSource) {
              formData.translations[langCode].attributes.values[baseKey] = Array.isArray(translatedValueArr) ? translatedValueArr.join(', ') : String(translatedValueArr);
            }
          }
        }
      }

    } catch (error) {
      console.error("Error fetching product for editing:", error);
      errorMessage.value = `Failed to load product: ${error.message}`;
    } finally {
      isSubmitting.value = false;
    }
  };


  // --- Submit Handler ---
  const handleSubmit = async () => {
    errorMessage.value = ''; // Clear previous errors

    // --- Validation ---
    if (!formData.name || formData.price === null || formData.price < 0) {
      errorMessage.value = "Product Name and a valid Price are required.";
      return;
    }
    // Ensure uploads are finished
    if (isAnyImageUploading.value) {
      errorMessage.value = 'Please wait for all image uploads to complete.';
      return;
    }
    // Filter out empty strings AND invalid URLs before validation
    const validImages = formData.images.filter(url => url && isUrlValid(url));
    if (validImages.length === 0) {
      errorMessage.value = 'Please upload at least one valid Product Image.';
      return;
    }
    // Validate base attribute pairs
    const baseAttributeKeys = new Set();
    for (const attr of formData.attributes) {
      const key = attr.key?.trim();
      const value = attr.value?.trim();
      if ((key && !value) || (!key && value)) {
        errorMessage.value = `Base attribute '${key || value}' is incomplete. Please provide both name and value(s).`;
        return;
      }
      if (key && baseAttributeKeys.has(key)) {
        errorMessage.value = `Duplicate base attribute name found: "${key}".`;
        return;
      }
      if (key) baseAttributeKeys.add(key);
    }


    // --- Prepare Payload ---
    const payload = {
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      description: formData.description?.trim() || '',
      category: formData.category?.trim() || '',
      slug: formData.slug?.trim() || slugify(formData.name.trim()),
      images: validImages, // Send only the valid, final URLs
      enabled: formData.enabled,
      attributes: {},
      translations: {}
    };

    // Process Base Attributes
    formData.attributes.forEach(attr => {
      const key = attr.key?.trim();
      const value = attr.value?.trim();
      if (key && value) {
        payload.attributes[key] = value.split(',').map(v => v.trim()).filter(Boolean);
      }
    });

    // Process Translations
    for (const langCode in formData.translations) {
      const trans = formData.translations[langCode];
      const payloadTrans = {};

      if (trans.name?.trim()) payloadTrans.name = trans.name.trim();
      if (trans.description?.trim()) payloadTrans.description = trans.description.trim();
      if (trans.category?.trim()) payloadTrans.category = trans.category.trim();

      const transAttrPayload = { keys: {}, values: {} };
      if (trans.attributes) {
        if (trans.attributes.keys) {
          for (const baseKey in trans.attributes.keys) {
            const translatedKey = trans.attributes.keys[baseKey]?.trim();
            if (payload.attributes[baseKey] && translatedKey) {
              transAttrPayload.keys[baseKey] = translatedKey;
            }
          }
        }
        if (trans.attributes.values) {
          for (const baseKey in trans.attributes.values) {
            const translatedValueString = trans.attributes.values[baseKey]?.trim();
            if (payload.attributes[baseKey] && translatedValueString) {
              transAttrPayload.values[baseKey] = translatedValueString.split(',').map(v => v.trim()).filter(Boolean);
            }
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
    if (Object.keys(payload.translations).length === 0) delete payload.translations;
    if (Object.keys(payload.attributes).length === 0) delete payload.attributes;

    console.log("Payload prepared:", JSON.stringify(payload, null, 2));

    // --- API Call ---
    isSubmitting.value = true;
    const url = isEditing.value ? `/api/products/${formData._id}` : '/api/products';
    const method = isEditing.value ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        if (errorData.errors) {
          const validationMessages = Object.values(errorData.errors).map(e => e.message).join(' ');
          throw new Error(`Validation Error: ${validationMessages}`);
        }
        throw new Error(errorData.message || `Failed to ${isEditing.value ? 'update' : 'add'} product`);
      }
      const resultProduct = await response.json();

      // Success
      createdProductId.value = resultProduct._id;
      createdProductNumber.value = resultProduct.productNumber || '';
      successTitle.value = isEditing.value ? 'Product Updated!' : 'Product Added!';
      successMessage.value = `Product "${resultProduct.name}" (${resultProduct.productNumber || 'N/A'}) saved successfully.`;

      // Reset upload states after successful save
      // resetImageStates(); - Keep images visible after save

      if (isEditing.value) {
        // Re-fetch to show potentially updated data (like productNumber if it was generated on backend update?)
        // Or just update necessary fields locally from resultProduct if needed.
        // For now, just showing the success message is likely enough.
      }

    } catch (error) {
      console.error(`Error ${isEditing.value ? 'updating' : 'adding'} product:`, error);
      errorMessage.value = error.message || 'An unexpected error occurred.';
    } finally {
      isSubmitting.value = false;
    }
  };

  // --- Lifecycle ---
  onMounted(() => {
    fetchCategories();
    if (productIdToEdit.value) {
      fetchProductForEditing(productIdToEdit.value);
    } else {
      initializeTranslations();
      resetImageStates(); // Ensure clean state for adding new
    }
  });

  // Clean up blob URLs when component is unmounted
  onUnmounted(() => {
    Object.values(localPreviews.value).forEach(URL.revokeObjectURL);
  });

</script>

<style scoped>
  /* --- Add styles for new elements --- */
  .form-section {
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    margin-bottom: 2rem;
    background-color: var(--white);
  }

    .form-section h3 {
      font-size: 1.2rem;
      color: var(--text-dark);
      margin: 0 0 1.5rem 0;
      padding-bottom: 0.8rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 0.6em;
    }

      .form-section h3 .svg-inline--fa {
        color: var(--primary);
        font-size: 0.9em;
      }

  .translations-section {
    background-color: var(--bg-light); /* Slightly different background */
  }

  .translation-tabs {
    display: flex;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--border-color);
    overflow-x: auto; /* Handle potential overflow */
  }

  .translation-tab {
    padding: 0.8rem 1.2rem;
    border: none;
    background: none;
    cursor: pointer;
    font-weight: 600;
    color: var(--text-muted);
    border-bottom: 3px solid transparent;
    transition: color 0.2s, border-color 0.2s;
    white-space: nowrap;
    margin-bottom: -1px; /* Overlap border */
  }

    .translation-tab:hover {
      color: var(--primary);
    }

    .translation-tab.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }

  .translation-pane {
    /* Styles for the content area of each tab */
  }

    .translation-pane h4 {
      font-size: 1rem;
      margin-bottom: 1.5rem;
      color: var(--text-dark);
      font-weight: 600;
    }

  /* Translated Attributes Section */
  .translated-attributes {
    margin-top: 1rem; /* Space above translated attributes */
  }

    .translated-attributes label {
      font-size: 1rem; /* Match base section label */
      font-weight: 600;
      margin-bottom: 1rem;
      display: block;
    }

  .attribute-translation-row {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px dashed var(--border-color);
  }

    .attribute-translation-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

  .base-attribute-display {
    font-size: 0.9rem;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
    padding: 0.5rem;
    background-color: var(--bg-off-light);
    border-radius: var(--border-radius-small);
    border: 1px solid var(--border-color);
  }

    .base-attribute-display strong {
      color: var(--text-dark);
    }

  .translated-inputs {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .attribute-key-translation,
  .attribute-value-translation {
    /* Inherits .enhanced-input */
  }

  .checkbox-group { /* Copied from AdminSettings */
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

    .checkbox-group label {
      margin-bottom: 0;
      font-weight: 500;
    }

    .checkbox-group input[type="checkbox"] {
      width: auto;
      height: auto;
      accent-color: var(--primary);
    }

  .preview-language-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
  }

    .preview-language-selector label {
      font-size: 0.9rem;
      font-weight: 600;
    }

    .preview-language-selector select.small {
      height: 36px;
      padding-top: 0.4rem;
      padding-bottom: 0.4rem;
      font-size: 0.9rem;
      min-width: 150px;
      flex-grow: 0; /* Don't let it grow too much */
      width: auto; /* Fit content */
    }

  /* Use shared admin layout/form styles from main.css */
  .admin-add-item {
    width: 100%;
  }

  .add-item-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
  }

  .form-panel {
    order: 1;
  }

  .preview-panel {
    order: 2;
    position: sticky;
    top: calc(60px + 1.5rem);
    max-height: calc(100vh - 60px - 3rem); /* Adjust based on header/padding */
    overflow-y: auto;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 1024px) {
    .form-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .attributes-section, .images-section {
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    padding: 1rem;
    margin-top: 1rem;
    background-color: var(--bg-light);
  }

    .attributes-section > label, .images-section > label {
      font-weight: 600;
      margin-bottom: 1rem;
      display: block;
      font-size: 1rem;
      color: var(--text-dark);
    }

  .no-attributes-message {
    font-style: italic;
    color: var(--text-muted);
    font-size: 0.9rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  .attribute-row {
    display: grid;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    align-items: center;
    grid-template-columns: minmax(120px, 1fr) minmax(120px, 1fr) auto;
  }

  .attribute-remove-btn {
    padding: 0.6rem;
    line-height: 1;
    margin: 0;
  }

  .add-attribute-btn {
    width: auto;
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

    .add-attribute-btn svg {
      margin-right: 0.4em;
    }


  /* --- Image Upload Styles --- */
  .image-upload-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    align-items: flex-start; /* Align items to the top */
    border-bottom: 1px dashed var(--border-color-light);
    padding-bottom: 1.5rem;
  }

    .image-upload-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

  .image-preview-area {
    width: 120px;
    height: 120px;
    border: 2px dashed var(--border-color);
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden; /* Clip image corners */
    background-color: var(--bg-off-light);
    flex-shrink: 0;
  }

  .image-preview-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-upload-trigger {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    width: 100%;
    height: 100%;
    color: var(--text-muted);
    transition: background-color 0.2s, color 0.2s;
    text-align: center;
    padding: 0.5rem;
  }

    .image-upload-trigger:hover {
      background-color: var(--border-color-light);
      color: var(--primary);
    }

    .image-upload-trigger svg {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .image-upload-trigger span {
      font-size: 0.8rem;
      font-weight: 500;
    }

  .image-status-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--text-dark);
    font-size: 0.9rem;
    backdrop-filter: blur(2px);
  }

    .image-status-overlay.uploading svg {
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
      color: var(--primary);
    }

    .image-status-overlay.error svg {
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
      color: var(--secondary);
    }

    .image-status-overlay span {
      font-weight: 500;
      margin-top: 0.25rem;
    }

  .image-controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex-grow: 1; /* Take remaining space */
  }

  .image-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-dark);
  }

  .image-remove-btn {
    padding: 0.5rem; /* Smaller padding */
    line-height: 1;
    margin: 0;
    align-self: flex-start; /* Align button to the start */
  }

    .image-remove-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

  .upload-error-text {
    font-size: 0.8rem;
    color: var(--secondary);
    margin-top: 0.25rem;
  }


  .add-image-btn {
    width: auto;
    margin-top: 1rem; /* Space above add button */
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

    .add-image-btn svg {
      margin-right: 0.4em;
    }

  .help-text {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 0.5rem;
  }
  /* --- End Image Upload Styles --- */


  .form-actions {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .error-message {
    color: var(--secondary);
    font-weight: 500;
    font-size: 0.9rem;
    flex-basis: 100%;
    order: -1;
    text-align: left;
  }

  .form-actions .button {
    margin-left: auto;
  }

  .form-actions .cancel-btn {
    margin-left: 0;
    margin-right: auto;
  }

  .save-btn svg {
    margin-right: 0.4em;
  }

  /* Preview Panel */
  .preview-panel .panel-title {
    margin-bottom: 1rem;
  }

  .image-preview-container {
    margin-bottom: 1.5rem;
  }

    .image-preview-container label {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--text-dark);
      margin-bottom: 0.75rem;
      display: block;
    }

  .preview-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .image-preview {
    width: 80px;
    text-align: center;
  }

  .preview-image {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: var(--border-radius-small);
    border: 1px solid var(--border-color);
    display: block;
    margin-bottom: 0.25rem;
    background-color: var(--bg-light);
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
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }

    .preview-placeholder.uploading-preview svg {
      color: var(--primary);
    }

    .preview-placeholder.error-preview svg {
      color: var(--secondary);
    }

  .image-number {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .preview-divider {
    border: none;
    height: 1px;
    background-color: var(--border-color);
    margin: 1.5rem 0;
  }

  .preview-info .preview-name {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-dark);
    margin: 0 0 0.5rem 0;
  }

  .preview-info .preview-price {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--primary);
    margin: 0 0 0.75rem 0;
  }

  .preview-info .preview-category {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-style: italic;
    margin: 0 0 0.75rem 0;
  }

  .preview-info .preview-description {
    font-size: 0.9rem;
    color: var(--text-muted);
    line-height: 1.5;
    margin: 0 0 1rem 0;
  }

  .preview-attributes {
    font-size: 0.9rem;
    color: var(--text-muted);
  }

    .preview-attributes strong {
      color: var(--text-dark);
    }

    .preview-attributes ul {
      list-style: none;
      padding-left: 0;
      margin: 0.5rem 0 0 0;
    }

    .preview-attributes li {
      margin-bottom: 0.3rem;
    }
  /* Success Panel */
  .success-panel {
    background-color: #e8f5e9;
    border-color: #a5d6a7;
    text-align: center;
  }

  .success-icon {
    font-size: 3rem;
    color: #388e3c;
    margin-bottom: 1rem;
  }

  .success-content h3 {
    color: #388e3c;
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-size: 1.5rem;
  }

  .success-content p {
    color: var(--text-dark);
    margin-bottom: 0.5rem;
    font-size: 1rem;
  }

    .success-content p strong {
      color: var(--primary);
    }

  .success-actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 1.5rem;
  }

    .success-actions .button svg {
      margin-right: 0.4em;
    }
  /* Responsive */
  @media (max-width: 992px) {
    .add-item-layout {
      grid-template-columns: 1fr;
    }

    .preview-panel {
      position: static;
      max-height: none;
      overflow-y: visible;
    }
  }

  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }

    .attribute-row {
      grid-template-columns: 1fr auto; /* Stack attribute inputs */
    }

      .attribute-row input:nth-of-type(2) {
        margin-top: 0.5rem; /* Add space between stacked inputs */
      }

    .image-upload-row {
      flex-direction: column; /* Stack preview and controls */
      align-items: center; /* Center items when stacked */
    }

    .image-preview-area {
      margin-bottom: 1rem;
    }

    .image-controls {
      width: 100%;
      align-items: center;
      text-align: center;
    }

    .image-remove-btn {
      align-self: center;
    }

    .form-actions {
      justify-content: center;
    }

      .form-actions .button {
        flex-grow: 1;
        max-width: 200px;
      }

      .form-actions .cancel-btn {
        order: 1;
        margin: 0;
      }

      .form-actions .save-btn {
        order: 2;
        margin: 0;
      }

      .form-actions .error-message {
        order: 0;
        text-align: center;
        margin-bottom: 1rem;
      }
  }
</style>
