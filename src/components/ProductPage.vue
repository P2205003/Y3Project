<template>
  <div class="product-page">
    <div v-if="loading" class="loading">Loading product...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else>
      <div class="product-container">
        <div class="left-side">
          <!-- Image gallery with navigation controls -->
          <div class="image-gallery">
            <div class="main-image-container">
              <img :src="currentImage" alt="Product Image" class="product-image">
            </div>
            <div v-if="product.images && product.images.length > 1" class="image-thumbnails">
              <div v-for="(image, index) in product.images"
                   :key="index"
                   class="thumbnail-container"
                   :class="{ active: currentImageIndex === index }"
                   @click="selectImage(index)">
                <img :src="image" alt="Product Thumbnail" class="thumbnail-image">
              </div>
            </div>
            <div v-if="product.images && product.images.length > 1" class="image-controls">
              <button @click="prevImage" class="control-button">&lt;</button>
              <span>{{ currentImageIndex + 1 }} / {{ product.images.length }}</span>
              <button @click="nextImage" class="control-button">&gt;</button>
            </div>
          </div>
        </div>
        <div class="right-side">
          <div class="top">
            <h1>{{ product.name }}</h1>
            <p class="price">${{ product.price.toFixed(2) }}</p>
          </div>
          <div class="bottom">
            <!-- Attribute selection -->
            <div class="attribute-selection" v-for="(values, attribute) in product.attributes" :key="attribute">
              <label>
                {{ attribute }}:
                <select v-model="selectedAttributes[attribute]">
                  <option v-for="value in getAttributeOptions(values)" :key="value" :value="value">
                    {{ value }}
                  </option>
                </select>
              </label>
            </div>

            <div class="quantity-selection">
              <label>
                Quantity:
                <input type="number"
                       v-model.number="quantity"
                       min="1"
                       max="10">
              </label>
            </div>
            <button @click="addToCart" class="add-to-cart">
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      <!-- Static recommendations (keep as-is) -->
      <div class="recommendation">
        <h2>Recommended Products</h2>
        <ul>
          <li v-for="recommendation in recommendations" :key="recommendation.id">
            <img :src="recommendation.image" alt="Recommendation Image">
            <p>{{ recommendation.name }} - ${{ recommendation.price }}</p>
          </li>
        </ul>
      </div>

      <div class="product-details">
        <h2>Product Details</h2>
        <p>{{ product.description }}</p>
        <div v-if="product.attributes" class="attributes">
          <h3>Specifications</h3>
          <ul>
            <li v-for="(value, key) in product.attributes" :key="key">
              <strong>{{ key }}:</strong> {{ value }}
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
  import placeholderImage from '@/components/placeholder.jpg';

  export default {
    name: 'ProductPage',
    data() {
      return {
        loading: true,
        error: null,
        product: null,
        quantity: 1,
        selectedAttributes: {},
        currentImageIndex: 0,
        // Keep static recommendations unchanged
        recommendations: [
          { id: 1, name: 'Recommended 1', price: 19.99, image: placeholderImage },
          { id: 2, name: 'Recommended 2', price: 29.99, image: placeholderImage },
          { id: 3, name: 'Recommended 3', price: 39.99, image: placeholderImage }
        ]
      };
    },
    computed: {
      currentImage() {
        if (!this.product || !this.product.images || this.product.images.length === 0) {
          return placeholderImage;
        }
        return this.product.images[this.currentImageIndex];
      },
      attributeLabel() {
        if (!this.product?.attributes) return '';
        return Object.keys(this.product.attributes)[0] || 'Option';
      },
      attributeOptions() {
        if (!this.product?.attributes) return {};
        return Object.entries(this.product.attributes).reduce((acc, [key, value]) => {
          acc[key] = Array.isArray(value) ? value : [value];
          return acc;
        }, {});
      }
    },
    async created() {
      try {
        const productId = this.$route.params.id;

        // Add validation for ID format
        if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
          throw new Error('Invalid product ID format');
        }

        const response = await fetch(`/api/products/${productId}`);

        // Add detailed error handling
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        this.product = await response.json();

        // Initialize attribute selections after data load
        if (this.product.attributes) {
          this.selectedAttributes = Object.entries(this.product.attributes).reduce((acc, [key, value]) => {
            acc[key] = Array.isArray(value) ? value[0] : value;
            return acc;
          }, {});
        }

      } catch (error) {
        this.error = error.message;
        console.error('Product fetch error:', error);
      } finally {
        this.loading = false;
      }
    },
    methods: {
      getAttributeOptions(values) {
        return Array.isArray(values) ? values : [values];
      },
      addToCart() {
        const cartItem = {
          productId: this.product._id,
          name: this.product.name,
          price: this.product.price,
          quantity: this.quantity,
          image: this.currentImage,
          attributes: this.selectedAttributes
        };

        // For now, just show alert - connect to cart store later
        alert(`Added to cart: ${cartItem.quantity}x ${cartItem.name}`);

        // Reset selection
        this.quantity = 1;
      },
      // New image gallery methods
      selectImage(index) {
        this.currentImageIndex = index;
      },
      nextImage() {
        if (!this.product || !this.product.images) return;
        this.currentImageIndex = (this.currentImageIndex + 1) % this.product.images.length;
      },
      prevImage() {
        if (!this.product || !this.product.images) return;
        this.currentImageIndex = (this.currentImageIndex - 1 + this.product.images.length) % this.product.images.length;
      }
    }
  };
</script>

<style scoped>
  .loading, .error {
    padding: 2rem;
    text-align: center;
    font-size: 1.2rem;
  }

  .product-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    padding: 2rem;
  }

  .product-image {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  /* Image gallery styles */
  .image-gallery {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .main-image-container {
    width: 100%;
    position: relative;
    aspect-ratio: 4/3;
    background: #f8f8f8;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

    .main-image-container .product-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

  .image-thumbnails {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }

  .thumbnail-container {
    width: 80px;
    height: 80px;
    border-radius: 4px;
    overflow: hidden;
    border: 2px solid transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f8f8;
  }

    .thumbnail-container.active {
      border-color: #42b983;
    }

  .thumbnail-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .image-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .control-button {
    padding: 0.5rem 1rem;
    background-color: #f8f8f8;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

    .control-button:hover {
      background-color: #eee;
    }

  .price {
    font-size: 1.5rem;
    color: #42b983;
    margin: 1rem 0;
  }

  .add-to-cart {
    background-color: #42b983;
    color: white;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 1rem;
  }

  .attributes {
    margin-top: 2rem;
    padding: 1rem;
    background: #f8f8f8;
    border-radius: 8px;
  }

    .attributes ul {
      list-style: none;
      padding: 0;
    }

    .attributes li {
      padding: 0.5rem 0;
      border-bottom: 1px solid #eee;
    }

  .recommendation {
    margin-top: 3rem;
    padding: 0 2rem;
  }

    .recommendation h2 {
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
      color: #333;
      border-bottom: 2px solid #42b983;
      padding-bottom: 0.5rem;
    }

    .recommendation ul {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
      padding: 0;
      margin: 0;
    }

    .recommendation li {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s ease;
      list-style: none;
    }

      .recommendation li:hover {
        transform: translateY(-3px);
      }

    .recommendation img {
      width: 100%;
      height: 200px;
      object-fit: contain;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .recommendation p {
      margin: 0.5rem 0;
      font-size: 0.9rem;
    }

      .recommendation p:first-of-type {
        font-weight: 600;
        color: #333;
      }

      .recommendation p:last-of-type {
        color: #42b983;
        font-size: 1.1rem;
        font-weight: bold;
      }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .recommendation ul {
      grid-template-columns: 1fr;
    }

    .product-container {
      grid-template-columns: 1fr;
      padding: 1rem;
    }

    .right-side {
      padding-top: 0;
    }

    .image-thumbnails {
      justify-content: center;
    }
  }
</style>
