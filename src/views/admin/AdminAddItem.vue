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

    <!-- Main Content: Form & Preview (Updated) -->
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
                <!-- Images -->
                <div class="form-group images-section">
                  <label>Product Images <span class="required">*</span></label>
                  <div v-for="(imageUrl, index) in formData.images" :key="`img-${index}`" class="image-row">
                    <input type="url" v-model="formData.images[index]" placeholder="https://example.com/image.jpg" class="enhanced-input image-input" :required="index === 0">
                    <button type="button" @click="removeImage(index)" class="action-btn delete-btn image-remove-btn" :disabled="formData.images.length === 1 && index === 0" title="Remove Image">
                      <font-awesome-icon icon="trash-alt" />
                    </button>
                  </div>
                  <button type="button" @click="addImage" class="button enhanced-button secondary add-image-btn">
                    <font-awesome-icon icon="plus" /> Add Image URL
                  </button>
                  <p class="help-text">First image is the main image. Enter valid URLs.</p>
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
            <button type="submit" class="button enhanced-button primary save-btn" :disabled="isSubmitting">
              <font-awesome-icon icon="spinner" spin v-if="isSubmitting" />
              <font-awesome-icon icon="save" v-else />
              {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update Product' : 'Add Product') }}
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
          <!-- Image Previews -->
          <div class="image-preview-container">
            <label>Image Previews</label>
            <div class="preview-list">
              <div v-for="(imageUrl, index) in formData.images" :key="`preview-${index}`" class="image-preview">
                <img v-if="imageUrl && isUrlValid(imageUrl)" :src="imageUrl" :alt="`Preview ${index + 1}`" class="preview-image" @error="onPreviewImageError">
                <div v-else class="preview-placeholder">
                  <font-awesome-icon icon="image" />
                </div>
                <span class="image-number">{{ index === 0 ? 'Main' : `Img ${index + 1}` }}</span>
              </div>
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
  import { ref, onMounted, computed, reactive, watch } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  // Import SUPPORTED_LOCALES from main.js
  import { SUPPORTED_LOCALES } from '@/main.js'; // Adjust path if necessary
  import { library } from '@fortawesome/fontawesome-svg-core';
  import {
    faPlusCircle, faPlus, faTrashAlt, faImage, faSave, faSpinner,
    faCheckCircle, faEye, faListAlt, faChevronLeft, faTags, faLanguage, faFlagUsa,
    faTimesCircle
  } from '@fortawesome/free-solid-svg-icons';

  library.add(
    faPlusCircle, faPlus, faTrashAlt, faImage, faSave, faSpinner,
    faCheckCircle, faEye, faListAlt, faChevronLeft, faTags, faLanguage, faFlagUsa,
    faTimesCircle
  );


  const router = useRouter();
  const route = useRoute();

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
  const isNewProduct = ref(!route.params.id); // Determine if adding or editing
  const isEditing = computed(() => !isNewProduct.value);
  const productIdToEdit = ref(route.params.id || null);

  // --- Form Data ---
  // Use reactive for nested objects like translations
  const initialFormDataState = () => ({
    _id: null,
    productNumber: '',
    name: '',
    price: null,
    description: '',
    category: '',
    slug: '',
    attributes: [], // Array of {key: '', value: ''} for base English attributes
    images: [''],
    enabled: true,
    translations: {} // Holds translation data keyed by language code
  });

  const formData = reactive(initialFormDataState());

  // Initialize translation structure for supported languages
  const initializeTranslations = () => {
    formData.translations = {}; // Ensure it's reset
    SUPPORTED_LOCALES.forEach(lang => {
      if (lang.code !== 'en') {
        formData.translations[lang.code] = {
          name: '',
          description: '',
          category: '',
          attributes: {
            keys: {},   // Maps baseKey -> translatedKey string
            values: {}  // Maps baseKey -> comma-separated translatedValues string
          }
        };
      }
    });
  }
  initializeTranslations(); // Initial setup

  // --- UI State ---
  const supportedLocales = ref(SUPPORTED_LOCALES);
  const activeTranslationTab = ref(supportedLocales.value.find(l => l.code !== 'en')?.code || null); // Default to first non-english tab
  const activePreviewLang = ref('en'); // Default preview to English

  // --- Computed ---
  const activePreviewLangName = computed(() => {
    return supportedLocales.value.find(l => l.code === activePreviewLang.value)?.name || 'English';
  });

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

  const addImage = () => { formData.images.push(''); };

  const removeImage = (index) => {
    if (formData.images.length > 1) {
      formData.images.splice(index, 1);
    } else if (formData.images.length === 1 && index === 0) {
      formData.images[0] = '';
    }
  };

  const onPreviewImageError = (event) => {
    // Instead of hiding, maybe show placeholder icon inside the div
    const parent = event.target.parentElement;
    if (parent) {
      event.target.style.display = 'none'; // Hide broken img tag
      const placeholder = parent.querySelector('.preview-placeholder');
      if (placeholder) placeholder.style.display = 'flex'; // Show placeholder div
    }
  };

  const resetFormForAdd = () => {
    successMessage.value = '';
    createdProductId.value = null;
    createdProductNumber.value = '';
    errorMessage.value = '';
    Object.assign(formData, initialFormDataState()); // Reset all fields
    initializeTranslations(); // Re-initialize translation structure
    activeTranslationTab.value = supportedLocales.value.find(l => l.code !== 'en')?.code || null;
    activePreviewLang.value = 'en';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const viewProduct = () => {
    if (!createdProductId.value) return;
    const productUrl = router.resolve({ name: 'product-detail', params: { id: createdProductId.value } }).href;
    window.open(productUrl, '_blank');
  };

  // Update attribute methods to specify 'base' or a language code
  const addAttribute = (type) => { // Type 'base' is the only one needed now
    if (type === 'base') {
      formData.attributes.push({ key: '', value: '' });
    }
  };

  const removeAttribute = (type, index) => {
    if (type === 'base') {
      const removedKey = formData.attributes[index]?.key;
      formData.attributes.splice(index, 1);
      // Also remove corresponding translation entries if the base key is removed
      if (removedKey) {
        SUPPORTED_LOCALES.forEach(lang => {
          if (lang.code !== 'en' && formData.translations[lang.code]) {
            // Use Vue.delete or recreate object if direct deletion isn't reactive
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
    // Check if translations exist for the active language and the specific field
    return formData.translations?.[activePreviewLang.value]?.[field] || formData[field]; // Fallback to base
  };

  const getPreviewAttributeKey = (baseKey) => {
    if (activePreviewLang.value === 'en' || !baseKey) {
      return baseKey;
    }
    // Check if translations and the specific key translation exist
    return formData.translations?.[activePreviewLang.value]?.attributes?.keys?.[baseKey] || baseKey;
  };

  const getPreviewAttributeValue = (baseKey, baseValue) => {
    if (activePreviewLang.value === 'en' || !baseKey) {
      return baseValue; // Return original comma-separated string
    }
    // Check if translations and the specific value translation exist
    return formData.translations?.[activePreviewLang.value]?.attributes?.values?.[baseKey] || baseValue;
  };


  // --- Fetch Product for Editing ---
  const fetchProductForEditing = async (id) => {
    console.log(`Fetching product ${id} for editing...`);
    isSubmitting.value = true; // Use for loading state
    errorMessage.value = '';
    try {
      // Fetch RAW product data including translations map
      const response = await fetch(`/api/products/admin/${id}`); // Use admin endpoint to get raw data
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
      formData.images = productData.images?.length ? [...productData.images] : [''];

      // Populate base attributes (convert Map/Object from DB to array for form)
      formData.attributes = [];
      if (productData.attributes && typeof productData.attributes === 'object') {
        // Handle both Map from direct Mongoose fetch and Object from JSON parse
        const attributesSource = productData.attributes instanceof Map
          ? productData.attributes
          : Object.entries(productData.attributes);

        for (const [key, value] of attributesSource) {
          // Ensure value is treated as an array, then join
          const valueString = Array.isArray(value) ? value.join(', ') : String(value || '');
          formData.attributes.push({ key, value: valueString });
        }
      }


      // Populate translations (handle Map/Object from DB)
      initializeTranslations(); // Reset first
      if (productData.translations && typeof productData.translations === 'object') {
        const translationsSource = productData.translations instanceof Map
          ? productData.translations
          : Object.entries(productData.translations);

        for (const [langCode, transData] of translationsSource) {
          if (formData.translations[langCode]) { // Check if it's a supported language
            formData.translations[langCode].name = transData.name || '';
            formData.translations[langCode].description = transData.description || '';
            formData.translations[langCode].category = transData.category || '';

            // Populate translated attributes
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
    const validImages = formData.images.filter(url => url && isUrlValid(url)); // Use helper
    if (validImages.length === 0) {
      errorMessage.value = 'Please provide at least one valid Image URL (starting with http/https).';
      return;
    }
    // Validate base attribute pairs
    const baseAttributeKeys = new Set();
    for (const attr of formData.attributes) {
      const key = attr.key?.trim(); // Use optional chaining
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
      description: formData.description?.trim() || '', // Handle potential null/undefined
      category: formData.category?.trim() || '',
      slug: formData.slug?.trim() || slugify(formData.name.trim()), // Auto-generate slug if empty
      images: validImages,
      enabled: formData.enabled,
      attributes: {}, // Base attributes object (key: string -> value: string[])
      translations: {} // Translations object (langCode: { name?, desc?, cat?, attributes? })
    };

    // Process Base Attributes (from array of {key, value} to object {key: [values]})
    formData.attributes.forEach(attr => {
      const key = attr.key?.trim();
      const value = attr.value?.trim();
      if (key && value) {
        payload.attributes[key] = value.split(',').map(v => v.trim()).filter(Boolean);
      }
    });
    // Ensure attributes is not sent if empty (optional, depends on backend)
    // if (Object.keys(payload.attributes).length === 0) delete payload.attributes;


    // Process Translations
    for (const langCode in formData.translations) {
      const trans = formData.translations[langCode];
      const payloadTrans = {}; // Build translation object only with provided fields

      if (trans.name?.trim()) payloadTrans.name = trans.name.trim();
      if (trans.description?.trim()) payloadTrans.description = trans.description.trim();
      if (trans.category?.trim()) payloadTrans.category = trans.category.trim();

      // Process translated attributes for this language
      const transAttrPayload = { keys: {}, values: {} };
      if (trans.attributes) {
        // Translated Keys
        if (trans.attributes.keys) {
          for (const baseKey in trans.attributes.keys) {
            const translatedKey = trans.attributes.keys[baseKey]?.trim();
            // Include only if base key exists in payload.attributes and translation is not empty
            if (payload.attributes[baseKey] && translatedKey) {
              transAttrPayload.keys[baseKey] = translatedKey;
            }
          }
        }
        // Translated Values
        if (trans.attributes.values) {
          for (const baseKey in trans.attributes.values) {
            const translatedValueString = trans.attributes.values[baseKey]?.trim();
            // Include only if base key exists and translation is not empty
            if (payload.attributes[baseKey] && translatedValueString) {
              transAttrPayload.values[baseKey] = translatedValueString.split(',').map(v => v.trim()).filter(Boolean);
            }
          }
        }
      }

      // Add attributes to translation payload only if they contain data
      if (Object.keys(transAttrPayload.keys).length > 0 || Object.keys(transAttrPayload.values).length > 0) {
        if (Object.keys(transAttrPayload.keys).length === 0) delete transAttrPayload.keys;
        if (Object.keys(transAttrPayload.values).length === 0) delete transAttrPayload.values;
        payloadTrans.attributes = transAttrPayload;
      }

      // Only add the language to payload if there's actual translated data
      if (Object.keys(payloadTrans).length > 0) {
        payload.translations[langCode] = payloadTrans;
      }
    }
    // Remove translations object if it's empty
    if (Object.keys(payload.translations).length === 0) {
      delete payload.translations;
    }
    // Remove attributes object if it's empty
    if (Object.keys(payload.attributes).length === 0) {
      delete payload.attributes;
    }


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
        // Attempt to provide more specific feedback
        if (errorData.errors) { // Mongoose validation error structure
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

      // If editing, maybe just show success and stay? If adding, allow adding another.
      if (isEditing.value) {
        // Optionally refetch to confirm, or just show success
        // fetchProductForEditing(formData._id);
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
      initializeTranslations(); // Ensure clean slate for adding
    }
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

  .attribute-row, .image-row {
    display: grid;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    align-items: center;
  }

  .attribute-row {
    grid-template-columns: minmax(120px, 1fr) minmax(120px, 1fr) auto;
  }

  .image-row {
    grid-template-columns: 1fr auto;
  }

  .attribute-remove-btn, .image-remove-btn {
    padding: 0.6rem;
    line-height: 1;
    margin: 0;
  }

  .add-attribute-btn, .add-image-btn {
    width: auto;
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

    .add-attribute-btn svg, .add-image-btn svg {
      margin-right: 0.4em;
    }

  .help-text {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 0.5rem;
  }

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
    }
  }

  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }

    .attribute-row {
      grid-template-columns: 1fr auto;
    }

      .attribute-row input:last-of-type {
        margin-top: 0.5rem;
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
