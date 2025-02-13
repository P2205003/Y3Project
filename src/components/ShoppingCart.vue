<template>
  <div class="shopping-cart">
    <h1>Shopping Cart</h1>
    <!-- Add your shopping cart content here -->
    <ul>
      <li v-for="item in cartItems" :key="item.id">
        {{ item.name }} - ${{ item.price }}
      </li>
    </ul>
    <!-- Total Price Box -->
    <div class="total-price-box">
      <p>Total: ${{ totalPrice }}</p>
      <button @click="checkout">Checkout</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShoppingCart',
  data() {
    return {
      cartItems: [
        { id: 1, name: 'Item 1', price: 10 },
        { id: 2, name: 'Item 2', price: 20 },
        { id: 3, name: 'Item 3', price: 99 }
      ]
    };
  },
  computed: {
    totalPrice() {
      return this.cartItems.reduce((total, item) => total + item.price, 0);
    }
  },
  methods: {
    checkout() {
      alert('Proceeding to checkout');
      // Add your checkout logic here
    }
  }
};
</script>

<style scoped>
.shopping-cart {
  padding: 20px;
  position: relative;
}

.total-price-box {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 10px;
  border: 1px solid #ccc;
  background-color: #f9f9f9;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.total-price-box p {
  margin: 0;
  font-weight: bold;
}

.total-price-box button {
  margin-top: 10px;
  padding: 10px;
  background-color: #007bff;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 4px;
}
</style>
