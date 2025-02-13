<template>
    <div class="add-item-page">
      <h1>Add New Item</h1>
      <form @submit.prevent="addItem">
        <div class="form-group">
          <label for="item-name">Item Name:</label>
          <input type="text" id="item-name" v-model="itemName" required />
        </div>
        <div class="form-group">
          <label for="item-price">Item Price:</label>
          <input type="number" id="item-price" v-model="itemPrice" min="0" required />
        </div>
        <div class="form-group">
          <label for="item-image">Upload Image:</label>
          <input type="file" id="item-image" @change="handleImageUpload" />
        </div>
        <button type="submit">Add Item</button>
      </form>
      <div v-if="previewImage" class="preview">
        <h2>Preview</h2>
        <img :src="previewImage" alt="Preview Image" />
        <p>{{ itemName }} - ${{ itemPrice }}</p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'AddItem',
    data() {
      return {
        itemName: '',
        itemPrice: '',
        previewImage: null,
        imageFile: null
      };
    },
    methods: {
      handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
          this.imageFile = file;
          this.previewImage = URL.createObjectURL(file);
        }
      },
      addItem() {
        alert(`Item "${this.itemName}" added successfully (for demo only).`);
        // Reset the form
        this.itemName = '';
        this.itemPrice = '';
        this.previewImage = null;
        this.imageFile = null;
      }
    }
  };
  </script>
  
  <style scoped>
  .add-item-page {
    padding: 20px;
  }
  .form-group {
    margin-bottom: 15px;
  }
  .form-group label {
    display: block;
    margin-bottom: 5px;
  }
  .form-group input {
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
  }
  button {
    padding: 10px 20px;
    background-color: #007bff;
    border: none;
    color: white;
    cursor: pointer;
    border-radius: 4px;
  }
  .preview {
    margin-top: 20px;
  }
  .preview img {
    max-width: 100px;
    display: block;
    margin-bottom: 10px;
  }
  </style>