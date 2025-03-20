<template>
  <div class="add-item-page">
    <h1>Add New Product</h1>

    <!-- Success message when product is created -->
    <div v-if="successMessage" class="success-message">
      <div class="success-content">
        <h3>Product Added Successfully!</h3>
        <p v-if="createdProductNumber">Product Number: <strong>{{ createdProductNumber }}</strong></p>
        <p v-else>Product ID: <strong>{{ createdProductId }}</strong></p>
        <div class="success-actions">
          <button @click="viewProduct" class="view-btn">View Product</button>
          <button @click="addAnother" class="add-another-btn">Add Another Product</button>
        </div>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" v-if="!successMessage">
      <div class="form-group">
        <label for="name">Product Name:</label>
        <input type="text" id="name" v-model="formData.name" required>
      </div>

      <div class="form-group">
        <label for="price">Price ($):</label>
        <input type="number" id="price" v-model="formData.price" min="0" step="0.01" required>
      </div>

      <div class="form-group">
        <label for="description">Description:</label>
        <textarea id="description" v-model="formData.description" required></textarea>
      </div>

      <div class="form-group">
        <label for="category">Category:</label>
        <input type="text" id="category" v-model="formData.category" required>
      </div>

      <!-- Manual product number input (uncomment if you want to allow manual input) -->
      <!-- <div class="form-group">
        <label for="productNumber">Product Number (Optional):</label>
        <div class="product-number-field">
          <input type="text" id="productNumber" v-model="formData.productNumber" placeholder="Auto-generated if left blank">
          <span class="help-text">Leave blank for auto-generated number</span>
        </div>
      </div> -->

      <div class="form-group">
        <label>Attributes</label>
        <div v-for="(attr, index) in formData.attributes" :key="index" class="attribute-row">
          <input type="text"
                 v-model="attr.key"
                 placeholder="Attribute name"
                 class="attribute-input">
          <input type="text"
                 v-model="attr.value"
                 placeholder="Attribute value"
                 class="attribute-input">
          <button type="button"
                  @click="removeAttribute(index)"
                  class="remove-attribute">
            ×
          </button>
        </div>
        <button type="button"
                @click="addAttribute"
                class="add-attribute">
          Add Attribute
        </button>
      </div>

      <!-- Multiple Images Section -->
      <div class="form-group">
        <label>Product Images:</label>
        <div v-for="(imageUrl, index) in formData.images" :key="index" class="image-row">
          <input type="url"
                 v-model="formData.images[index]"
                 placeholder="Image URL"
                 class="image-input"
                 required>
          <button type="button"
                  @click="removeImage(index)"
                  class="remove-image"
                  :disabled="formData.images.length === 1">
            ×
          </button>
        </div>
        <button type="button"
                @click="addImage"
                class="add-image">
          Add Another Image
        </button>
        <p class="help-text">First image will be used as the main product image.</p>
      </div>

      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Adding...' : 'Add Product' }}
      </button>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </form>

    <div class="preview" v-if="!successMessage">
      <h3>Preview</h3>
      <div class="image-preview-container">
        <div v-for="(imageUrl, index) in formData.images" :key="index" class="image-preview">
          <img v-if="imageUrl" :src="imageUrl" :alt="`Product preview ${index + 1}`" class="preview-image">
          <div v-else class="preview-placeholder">No image</div>
          <div class="image-number">{{ index === 0 ? 'Main Image' : `Image ${index + 1}` }}</div>
        </div>
      </div>
      <div class="preview-info">
        <h4>{{ formData.name || 'Product Name' }}</h4>
        <p>${{ (formData.price || 0).toFixed(2) }}</p>
        <p>{{ formData.description || 'Product description' }}</p>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'AddItem',
    data() {
      return {
        isSubmitting: false,
        errorMessage: '',
        successMessage: '',
        createdProductId: null,
        createdProductNumber: '',
        formData: {
          name: '',
          price: 0,
          description: '',
          category: '',
          attributes: [],
          images: [''],
          // productNumber: '', // Uncomment if you want to allow manual input
        }
      };
    },
    methods: {
      addAttribute() {
        this.formData.attributes.push({ key: '', value: '' });
      },
      removeAttribute(index) {
        this.formData.attributes.splice(index, 1);
      },
      // Image management methods
      addImage() {
        this.formData.images.push('');
      },
      removeImage(index) {
        // Keep at least one image
        if (this.formData.images.length > 1) {
          this.formData.images.splice(index, 1);
        }
      },
      // Navigation after successful creation
      viewProduct() {
        this.$router.push({ name: 'ProductPage', params: { id: this.createdProductId } });
      },
      addAnother() {
        // Reset form to add another product
        this.successMessage = '';
        this.createdProductId = null;
        this.createdProductNumber = '';
        this.formData = {
          name: '',
          price: 0,
          description: '',
          category: '',
          attributes: [],
          images: [''],
          // productNumber: '',  // Uncomment if you want to allow manual input
        };
      },
      async handleSubmit() {
        // Add validation for attribute keys
        const uniqueKeys = new Set();
        for (const attr of this.formData.attributes) {
          if (attr.key && attr.value) {
            if (uniqueKeys.has(attr.key)) {
              this.errorMessage = `Duplicate attribute key: ${attr.key}`;
              return;
            }
            uniqueKeys.add(attr.key);
          }
        }

        // Filter out empty image URLs
        const validImages = this.formData.images.filter(url => url.trim() !== '');
        if (validImages.length === 0) {
          this.errorMessage = 'Please provide at least one image URL';
          return;
        }

        // Convert attributes array to object before sending
        const attributes = this.formData.attributes.reduce((acc, attr) => {
          if (attr.key && attr.value) {
            acc[attr.key] = attr.value.split(',').map(v => v.trim());
          }
          return acc;
        }, {});

        const payload = {
          ...this.formData,
          images: validImages, // Use the filtered images array
          attributes,
          price: parseFloat(this.formData.price),
          enabled: true,
        };

        this.isSubmitting = true;
        this.errorMessage = '';

        try {
          const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Add this to ensure auth cookies are sent
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add product');
          }

          const newProduct = await response.json();

          // Store the created product info for success message
          this.createdProductId = newProduct._id;
          this.createdProductNumber = newProduct.productNumber || '';
          this.successMessage = `Product "${newProduct.name}" added successfully!`;

          console.log("Created product:", newProduct);

        } catch (error) {
          console.error('Add product error:', error);
          this.errorMessage = error.message || 'Failed to add product. Please try again.';
        } finally {
          this.isSubmitting = false;
        }
      }
    }
  };
</script>

<style scoped>
  .add-item-page {
    max-width: 800px;
    margin: 2rem auto;
    padding: 1rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }

  input[type="text"],
  input[type="number"],
  input[type="url"],
  textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  button {
    background-color: #42b983;
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

    button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

  .preview {
    margin-top: 2rem;
    padding: 1rem;
    border: 1px solid #eee;
    border-radius: 4px;
  }

  .preview-image {
    max-width: 100%;
    height: 150px;
    object-fit: contain;
  }

  .preview-placeholder {
    width: 100%;
    height: 150px;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-style: italic;
  }

  .attribute-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .attribute-input {
    flex: 1;
  }

  .image-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    align-items: center;
  }

  .image-input {
    flex: 1;
  }

  .remove-attribute,
  .remove-image {
    background-color: #ff6b6b;
    color: white;
    width: 30px;
    height: 30px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
  }

  .add-attribute,
  .add-image {
    background-color: #4d7eff;
    margin-top: 0.5rem;
  }

  .help-text {
    font-size: 0.85rem;
    color: #666;
    margin-top: 0.5rem;
  }

  .image-preview-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .image-preview {
    width: 150px;
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 0.5rem;
    text-align: center;
  }

  .image-number {
    font-size: 0.85rem;
    color: #666;
    margin-top: 0.5rem;
  }

  .attribute-row:has(.attribute-input:invalid) {
    position: relative;
    border: 2px solid #ff4444;
    padding: 0.5rem;
    border-radius: 4px;
  }

    .attribute-row:has(.attribute-input:invalid)::after {
      content: "Both fields required";
      position: absolute;
      right: 0;
      bottom: -1.2rem;
      color: #ff4444;
      font-size: 0.8rem;
    }

  .error-message {
    color: #ff4444;
    margin-top: 1rem;
    padding: 0.5rem;
    border: 1px solid #ff4444;
    border-radius: 4px;
  }

  /* Success message styles */
  .success-message {
    background-color: #e8f5e9;
    border: 1px solid #66bb6a;
    border-radius: 4px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .success-content {
    text-align: center;
  }

    .success-content h3 {
      color: #2e7d32;
      margin-top: 0;
    }

  .success-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .view-btn {
    background-color: #1976d2;
  }

  .add-another-btn {
    background-color: #5D5CDE;
  }

  .product-number-field {
    position: relative;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .add-item-page {
      color: #e2e8f0;
    }

    input[type="text"],
    input[type="number"],
    input[type="url"],
    textarea {
      background-color: #1a202c;
      border-color: #4a5568;
      color: #e2e8f0;
    }

    .preview {
      border-color: #4a5568;
    }

    .preview-placeholder {
      background-color: #2d3748;
      color: #a0aec0;
    }

    .help-text,
    .image-number {
      color: #a0aec0;
    }

    .success-message {
      background-color: rgba(46, 125, 50, 0.2);
      border-color: #2e7d32;
    }

    .success-content h3 {
      color: #66bb6a;
    }

    .image-preview {
      border-color: #4a5568;
    }
  }
</style>
