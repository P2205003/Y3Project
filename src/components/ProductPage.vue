<template>
    <div class="product-page">
      <div class="product-container">
        <div class="left-side">
          <img :src="product.image" alt="Product Image">
        </div>
        <div class="right-side">
          <div class="top">
            <h1>{{ product.title }}</h1>
          </div>
          <div class="bottom">
            <div class="version-selection">
              <label>
                Version:
                <select v-model="selectedVersion">
                  <option v-for="version in product.versions" :key="version" :value="version">
                    {{ version }}
                  </option>
                </select>
              </label>
            </div>
            <div class="quantity-selection">
              <label>
                Quantity:
                <input type="number" v-model="quantity" min="1">
              </label>
            </div>
            <button @click="addToCart">Add to Cart</button>
          </div>
        </div>
      </div>
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
        <p>{{ product.details }}</p>
      </div>
    </div>
</template>
  
<script>
  import productImage from './g.png';
  
  export default {
    name: 'ProductPage',
    data() {
      return {
        product: {
          image: productImage,
          title: 'Product Title',
          versions: ['Version 1', 'Version 2', 'Version 3'],
          details: 'Detailed description of the product.'
        },
        selectedVersion: '',
        quantity: 1,
        recommendations: [
          { id: 1, name: 'Recommended Product 1', price: 10, image: productImage },
          { id: 2, name: 'Recommended Product 2', price: 20, image: productImage },
          { id: 3, name: 'Recommended Product 3', price: 30, image: productImage }
        ]
      };
    },
    methods: {
      addToCart() {
        alert(`Added ${this.quantity} ${this.product.title} (${this.selectedVersion}) to cart`);
        // Add your logic to add the product to the cart
      }
    }
  };
</script>
  
<style scoped>
.product-page {
  display: flex;
  flex-direction: column;
}

.product-container {
  display: flex;
  width: 100%;
}

.left-side {
  width: 40%;
  padding: 20px;
  box-sizing: border-box;
  max-height: 300px; /* Set a fixed height for the image box */
}

.left-side img {
  width: 100%;
  height: 100%;
  object-fit: contain; /* Ensure the image maintains its aspect ratio */
}

.right-side {
  width: 60%;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  max-height: 300px; /* Match the height of the image box */
}

.top, .bottom {
  height: 50%; /* Adjust the heights to match the image box */
}

.recommendation, .product-details {
  width: 100%;
  padding: 20px;
  border-top: 1px solid #ccc;
  margin-top: 20px;
}

.recommendation ul {
  list-style-type: none;
  padding: 0;
}

.recommendation li {
  display: inline-block;
  width: 30%;
  padding: 10px;
}

.recommendation img {
  max-width: 100%;
  height: auto;
}
</style>

  