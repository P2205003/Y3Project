<template>
  <div class="admin-add-item">
    <!-- Page Header -->
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
          <div class="form-grid">
            <!-- Column 1: Core Info -->
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
                <!-- Optional: Datalist for suggestions (fetch categories if needed) -->
                <datalist id="category-suggestions-add">
                  <option v-for="cat in categories" :key="`cat-add-${cat}`" :value="cat"></option>
                </datalist>
              </div>

              <div class="form-group">
                <label for="description">Description</label>
                <textarea id="description" v-model="formData.description" rows="5" class="enhanced-textarea"></textarea>
              </div>
            </div>

            <!-- Column 2: Attributes & Images -->
            <div class="form-column">
              <!-- Attributes -->
              <div class="form-group attributes-section">
                <label>Attributes</label>
                <div v-if="formData.attributes.length === 0" class="no-attributes-message">No attributes added.</div>
                <div v-for="(attr, index) in formData.attributes" :key="index" class="attribute-row">
                  <input type="text" v-model="attr.key" placeholder="Attribute name (e.g., Material)" class="enhanced-input attribute-input">
                  <input type="text" v-model="attr.value" placeholder="Value(s) (e.g., Oak, Walnut)" class="enhanced-input attribute-input">
                  <button type="button" @click="removeAttribute(index)" class="action-btn delete-btn attribute-remove-btn" title="Remove Attribute">
                    <font-awesome-icon icon="trash-alt" />
                  </button>
                </div>
                <button type="button" @click="addAttribute" class="button enhanced-button secondary add-attribute-btn">
                  <font-awesome-icon icon="plus" /> Add Attribute
                </button>
              </div>

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
                  <font-awesome-icon icon="plus" /> Add Another Image
                </button>
                <p class="help-text">First image is the main image. Enter valid URLs.</p>
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
        <h2 class="panel-title">Preview</h2>
        <div class="preview-content">
          <div class="image-preview-container">
            <label>Image Previews</label>
            <div class="preview-list">
              <div v-for="(imageUrl, index) in formData.images" :key="`preview-${index}`" class="image-preview">
                <img v-if="imageUrl" :src="imageUrl" :alt="`Preview ${index + 1}`" class="preview-image" @error="onPreviewImageError">
                <div v-else class="preview-placeholder">
                  <font-awesome-icon icon="image" />
                </div>
                <span class="image-number">{{ index === 0 ? 'Main' : `Img ${index + 1}` }}</span>
              </div>
            </div>
          </div>
          <hr class="preview-divider">
          <div class="preview-info">
            <h4 class="preview-name">{{ formData.name || 'Product Name' }}</h4>
            <p class="preview-price">${{ (formData.price || 0).toFixed(2) }}</p>
            <p class="preview-category" v-if="formData.category">Category: {{ formData.category }}</p>
            <p class="preview-description">{{ formData.description || 'Product description will appear here...' }}</p>
            <div v-if="formData.attributes.length > 0" class="preview-attributes">
              <strong>Attributes:</strong>
              <ul>
                <li v-for="(attr, index) in formData.attributes" :key="`prev-attr-${index}`">
                  <span v-if="attr.key && attr.value"><strong>{{ attr.key }}:</strong> {{ attr.value }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div> <!-- End add-item-layout -->
  </div>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { library } from '@fortawesome/fontawesome-svg-core';
  import {
    faPlusCircle, faPlus, faTrashAlt, faImage, faSave, faSpinner,
    faCheckCircle, faEye, faListAlt, faChevronLeft
  } from '@fortawesome/free-solid-svg-icons';

  library.add(
    faPlusCircle, faPlus, faTrashAlt, faImage, faSave, faSpinner,
    faCheckCircle, faEye, faListAlt, faChevronLeft
  );

  const router = useRouter();
  const route = useRoute(); // Add this if you plan to use route params (e.g., for editing)

  // --- State ---
  const isSubmitting = ref(false);
  const errorMessage = ref('');
  const successMessage = ref('');
  const successTitle = ref('');
  const createdProductId = ref(null);
  const createdProductNumber = ref('');
  const categories = ref([]); // To hold fetched categories for datalist

  const initialFormData = () => ({
    name: '',
    price: null, // Use null initially for number inputs
    description: '',
    category: '',
    attributes: [],
    images: [''], // Start with one empty image URL input
    enabled: true // Default to enabled
  });

  const formData = ref(initialFormData());

  // Placeholder for editing state (adapt if needed)
  const isEditing = ref(false); // Set to true if editing an existing product

  // --- Methods ---
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      categories.value = await response.json();
    } catch (error) {
      console.error("Error fetching categories:", error);
      // categories.value = []; // Keep existing if fetch fails? Or clear?
    }
  };

  const addAttribute = () => {
    formData.value.attributes.push({ key: '', value: '' });
  };

  const removeAttribute = (index) => {
    formData.value.attributes.splice(index, 1);
  };

  const addImage = () => {
    formData.value.images.push('');
  };

  const removeImage = (index) => {
    // Keep at least one image input, just clear it if it's the last one
    if (formData.value.images.length > 1) {
      formData.value.images.splice(index, 1);
    } else if (formData.value.images.length === 1 && index === 0) {
      formData.value.images[0] = ''; // Clear the URL
      // Optionally alert user they need at least one image
    }
  };

  const onPreviewImageError = (event) => {
    event.target.style.display = 'none'; // Hide broken image preview
    // Find the corresponding placeholder and display it maybe? Or just hide.
  };

  const resetFormForAdd = () => {
    successMessage.value = '';
    createdProductId.value = null;
    createdProductNumber.value = '';
    errorMessage.value = '';
    formData.value = initialFormData();
    // Optionally scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const viewProduct = () => {
    if (!createdProductId.value) return;
    // Open in new tab for convenience
    const productUrl = router.resolve({ name: 'product-detail', params: { id: createdProductId.value } }).href;
    window.open(productUrl, '_blank');
  };

  const handleSubmit = async () => {
    // --- Basic Client-Side Validation ---
    if (!formData.value.name || formData.value.price === null || formData.value.price < 0) {
      errorMessage.value = "Product Name and a valid Price are required.";
      return;
    }
    const validImages = formData.value.images.filter(url => url && url.trim().startsWith('http'));
    if (validImages.length === 0) {
      errorMessage.value = 'Please provide at least one valid Image URL (starting with http/https).';
      return;
    }

    // Check attribute keys are unique and pairs are complete
    const attributeKeys = new Set();
    const incompleteAttributes = formData.value.attributes.some(attr => (attr.key && !attr.value) || (!attr.key && attr.value));
    if (incompleteAttributes) {
      errorMessage.value = "Please ensure all added attributes have both a name and a value.";
      return;
    }
    for (const attr of formData.value.attributes) {
      if (attr.key && attr.value) {
        const trimmedKey = attr.key.trim();
        if (!trimmedKey) {
          errorMessage.value = "Attribute names cannot be empty.";
          return;
        }
        if (attributeKeys.has(trimmedKey)) {
          errorMessage.value = `Duplicate attribute name found: "${trimmedKey}".`;
          return;
        }
        attributeKeys.add(trimmedKey);
      }
    }

    // --- Prepare Payload ---
    // Convert attributes array to object, handle comma-separated values
    const attributesObject = {};
    formData.value.attributes.forEach(attr => {
      const key = attr.key?.trim();
      const value = attr.value?.trim();
      if (key && value) {
        // Split by comma, trim each part, filter out empty strings
        const valuesArray = value.split(',').map(v => v.trim()).filter(Boolean);
        if (valuesArray.length > 0) {
          attributesObject[key] = valuesArray;
          // Optional: if only one value, store as string (adjust based on backend needs)
          // if (valuesArray.length === 1) {
          //     attributesObject[key] = valuesArray[0];
          // }
        }
      }
    });

    const payload = {
      name: formData.value.name.trim(),
      price: parseFloat(formData.value.price),
      description: formData.value.description.trim(),
      category: formData.value.category.trim(),
      images: validImages, // Use filtered valid URLs
      attributes: attributesObject,
      enabled: formData.value.enabled, // Include status
    };

    // Determine API endpoint and method based on isEditing
    const url = isEditing.value ? `/api/products/${route.params.id}` : '/api/products'; // Assuming route param 'id' if editing
    const method = isEditing.value ? 'PUT' : 'POST';

    // --- API Call ---
    isSubmitting.value = true;
    errorMessage.value = '';
    successMessage.value = '';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send cookies for authentication
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditing.value ? 'update' : 'add'} product`);
      }

      const resultProduct = await response.json();

      // Success!
      createdProductId.value = resultProduct._id;
      createdProductNumber.value = resultProduct.productNumber || '';
      successTitle.value = isEditing.value ? 'Product Updated Successfully!' : 'Product Added Successfully!';
      successMessage.value = `Product "${resultProduct.name}" has been saved.`;

      // Don't reset form immediately on edit, let user see success
      // If adding, resetFormForAdd() is called manually by the "Add Another" button

    } catch (error) {
      console.error(`Error ${isEditing.value ? 'updating' : 'adding'} product:`, error);
      errorMessage.value = error.message || `An unexpected error occurred. Please try again.`;
    } finally {
      isSubmitting.value = false;
    }
  };


  // --- Lifecycle ---
  onMounted(() => {
    fetchCategories();
    // Add logic here to check if we are editing based on route params
    // and fetch existing product data if necessary
    // Example:
    // if (route.params.id) {
    //   isEditing.value = true;
    //   fetchProductForEditing(route.params.id);
    // }
  });

</script>

<style scoped>
  /* Use styles from main.css where possible */
  .admin-add-item {
    width: 100%;
  }

  .required {
    color: var(--secondary);
    margin-left: 0.2em;
  }

  /* Layout */
  .add-item-layout {
    display: grid;
    grid-template-columns: 2fr 1fr; /* Form takes more space */
    gap: 2rem;
  }

  .form-panel {
    order: 1;
  }

  .preview-panel {
    order: 2;
    position: sticky;
    top: calc(60px + 1.5rem); /* Adjust based on header height */
  }

  /* Form Grid within Form Panel */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr; /* Stack by default */
    gap: 1.5rem;
  }

  @media (min-width: 1024px) { /* Adjust breakpoint if needed */
    .form-grid {
      grid-template-columns: 1fr 1fr;
    }
    /* Side-by-side columns */
  }

  /* Specific sections within form */
  .attributes-section, .images-section {
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    padding: 1rem;
    margin-top: 1rem;
    background-color: var(--bg-light);
  }

    .attributes-section > label, .images-section > label { /* Top label */
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

  .attribute-input, .image-input { /* Styles from .enhanced-input */
  }

  .attribute-remove-btn, .image-remove-btn {
    /* Inherit from .action-btn.delete-btn */
    padding: 0.6rem;
    line-height: 1;
    margin: 0;
  }

  .add-attribute-btn, .add-image-btn {
    /* Inherit from .button.enhanced-button.secondary */
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
    flex-basis: 100%; /* Take full width on small screens */
    order: -1; /* Show error first */
    text-align: left;
  }

  .form-actions .button {
    margin-left: auto;
  }
  /* Push buttons right by default */
  .form-actions .cancel-btn {
    margin-left: 0;
    margin-right: auto;
  }
  /* Push cancel left */

  .save-btn svg {
    margin-right: 0.4em;
  }

  /* Preview Panel */
  .preview-panel .panel-title {
    margin-bottom: 1rem;
  }

  .preview-content { /* Container for preview elements */
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
    background-color: #e8f5e9; /* Light success green */
    border-color: #a5d6a7;
    text-align: center;
  }

  .success-content { /* Inner content */
  }

  .success-icon {
    font-size: 3rem;
    color: #388e3c; /* Darker success green */
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
    /* Stack on smaller screens */
    .preview-panel {
      position: static; /* Unstick preview */
    }
  }

  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    /* Ensure single column */
    .attribute-row {
      grid-template-columns: 1fr auto;
    }
      /* Stack key/value, keep remove btn */
      .attribute-row input:last-of-type {
        margin-top: 0.5rem;
      }
    /* Space between stacked inputs */
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
