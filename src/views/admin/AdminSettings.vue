<template>
  <div class="admin-settings">
    <div class="admin-page-header">
      <h1>Admin Settings</h1>
    </div>

    <div class="admin-panel">
      <h2>Site Configuration</h2>

      <form @submit.prevent="saveSettings" class="settings-form">
        <div class="form-section">
          <h3>General Settings</h3>

          <div class="form-group">
            <label for="site-name">Site Name</label>
            <input type="text" id="site-name" v-model="settings.siteName" />
          </div>

          <div class="form-group">
            <label for="site-description">Site Description</label>
            <textarea id="site-description"
                      v-model="settings.siteDescription"
                      rows="3"></textarea>
          </div>

          <div class="form-group">
            <label for="contact-email">Contact Email</label>
            <input type="email" id="contact-email" v-model="settings.contactEmail" />
          </div>
        </div>

        <div class="form-section">
          <h3>Display Options</h3>

          <div class="form-group">
            <label for="products-per-page">Products Per Page</label>
            <input type="number"
                   id="products-per-page"
                   v-model="settings.productsPerPage"
                   min="1"
                   max="100" />
          </div>

          <div class="form-group checkbox-group">
            <input type="checkbox"
                   id="enable-dark-mode"
                   v-model="settings.enableDarkMode" />
            <label for="enable-dark-mode">Enable Dark Mode by Default</label>
          </div>

          <div class="form-group checkbox-group">
            <input type="checkbox"
                   id="show-out-of-stock"
                   v-model="settings.showOutOfStock" />
            <label for="show-out-of-stock">Show Out of Stock Products</label>
          </div>
        </div>

        <div class="form-section">
          <h3>Notification Settings</h3>

          <div class="form-group checkbox-group">
            <input type="checkbox"
                   id="order-notifications"
                   v-model="settings.notifications.orders" />
            <label for="order-notifications">Receive New Order Notifications</label>
          </div>

          <div class="form-group checkbox-group">
            <input type="checkbox"
                   id="user-notifications"
                   v-model="settings.notifications.users" />
            <label for="user-notifications">Receive New User Notifications</label>
          </div>

          <div class="form-group checkbox-group">
            <input type="checkbox"
                   id="stock-notifications"
                   v-model="settings.notifications.stock" />
            <label for="stock-notifications">Receive Low Stock Notifications</label>
          </div>
        </div>

        <div class="form-section">
          <h3>Advanced Settings</h3>

          <div class="form-group">
            <label for="maintenance-mode">Maintenance Mode</label>
            <select id="maintenance-mode" v-model="settings.maintenanceMode">
              <option value="off">Off</option>
              <option value="scheduled">Scheduled</option>
              <option value="on">On</option>
            </select>
          </div>

          <div v-if="settings.maintenanceMode === 'scheduled'" class="form-group">
            <label for="maintenance-date">Maintenance Date</label>
            <input type="datetime-local"
                   id="maintenance-date"
                   v-model="settings.maintenanceDate" />
          </div>

          <div class="form-group">
            <label for="api-key">API Key</label>
            <div class="api-key-container">
              <input type="text"
                     id="api-key"
                     v-model="settings.apiKey"
                     readonly />
              <button type="button"
                      class="regenerate-btn"
                      @click="regenerateApiKey">
                Regenerate
              </button>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="reset" class="reset-btn" @click="resetSettings">Reset to Default</button>
          <button type="submit" class="save-btn" :disabled="isSaving">
            {{ isSaving ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminSettings',
  data() {
    return {
      isSaving: false,
      settings: {
        siteName: 'E-Commerce Store',
        siteDescription: 'Your one-stop shop for all your shopping needs.',
        contactEmail: 'contact@example.com',
        productsPerPage: 12,
        enableDarkMode: false,
        showOutOfStock: true,
        notifications: {
          orders: true,
          users: false,
          stock: true
        },
        maintenanceMode: 'off',
        maintenanceDate: '',
        apiKey: 'sk_test_51KmZEtGhXs8OpVFSxUY6RNTzKwL3J2c'
      },
      defaultSettings: {}
    };
  },
  created() {
    // Save a copy of the default settings
    this.defaultSettings = JSON.parse(JSON.stringify(this.settings));

    // Fetch settings (in a real app)
    this.fetchSettings();
  },
  methods: {
    async fetchSettings() {
      // In a real app, this would be an API call
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // For demo purposes, we'll just use the default settings
      // this.settings would be updated with the response from the server
    },

    async saveSettings() {
      this.isSaving = true;

      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Show success message
        alert('Settings saved successfully');
      } catch (error) {
        console.error('Error saving settings:', error);
        alert('Failed to save settings');
      } finally {
        this.isSaving = false;
      }
    },

    resetSettings() {
      if (confirm('Are you sure you want to reset all settings to default values?')) {
        this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
      }
    },

    regenerateApiKey() {
      if (confirm('Are you sure you want to regenerate the API key? This will invalidate the current key.')) {
        // In a real app, this would be an API call
        // For demo purposes, we'll generate a random string
        this.settings.apiKey = 'sk_test_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      }
    }
  }
};
</script>

<style scoped>
  .admin-settings {
    width: 100%;
  }

  .admin-page-header {
    margin-bottom: 1.5rem;
  }

    .admin-page-header h1 {
      margin: 0;
      font-size: 1.8rem;
      color: #333;
    }

  .admin-panel {
    background-color: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

    .admin-panel h2 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      font-size: 1.4rem;
      color: #333;
      border-bottom: 1px solid #eee;
      padding-bottom: 0.75rem;
    }

  .settings-form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .form-section {
    border-bottom: 1px solid #eee;
    padding-bottom: 2rem;
  }

    .form-section:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .form-section h3 {
      margin-top: 0;
      margin-bottom: 1.25rem;
      font-size: 1.2rem;
      color: #333;
    }

  .form-group {
    margin-bottom: 1.25rem;
  }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .form-group input[type="text"],
    .form-group input[type="email"],
    .form-group input[type="number"],
    .form-group input[type="datetime-local"],
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

  .checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

    .checkbox-group label {
      margin-bottom: 0;
    }

    .checkbox-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
    }

  .api-key-container {
    display: flex;
    gap: 0.75rem;
  }

    .api-key-container input {
      flex: 1;
      background-color: #f5f5f5;
    }

  .regenerate-btn {
    background-color: #ff9800;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.75rem 1rem;
    font-weight: 500;
    cursor: pointer;
  }

    .regenerate-btn:hover {
      background-color: #f57c00;
    }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }

  .reset-btn, .save-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
  }

  .reset-btn {
    background-color: white;
    border: 1px solid #ddd;
    color: #666;
  }

    .reset-btn:hover {
      background-color: #f5f5f5;
    }

  .save-btn {
    background-color: #5D5CDE;
    border: none;
    color: white;
  }

    .save-btn:hover:not(:disabled) {
      background-color: #4a49b8;
    }

    .save-btn:disabled {
      background-color: #9998e8;
      cursor: not-allowed;
    }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .admin-page-header h1 {
      color: #e2e8f0;
    }

    .admin-panel {
      background-color: #2d3748;
    }

      .admin-panel h2 {
        color: #e2e8f0;
        border-bottom-color: #4a5568;
      }

    .form-section {
      border-bottom-color: #4a5568;
    }

      .form-section h3 {
        color: #e2e8f0;
      }

    .form-group label {
      color: #e2e8f0;
    }

    .form-group input[type="text"],
    .form-group input[type="email"],
    .form-group input[type="number"],
    .form-group input[type="datetime-local"],
    .form-group select,
    .form-group textarea {
      background-color: #1a202c;
      border-color: #4a5568;
      color: #e2e8f0;
    }

    .api-key-container input {
      background-color: #2a343f;
    }

    .reset-btn {
      background-color: #2d3748;
      border-color: #4a5568;
      color: #e2e8f0;
    }

      .reset-btn:hover {
        background-color: #3a4a5f;
      }
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .api-key-container {
      flex-direction: column;
    }

    .regenerate-btn {
      align-self: flex-end;
    }

    .form-actions {
      flex-direction: column;
    }

    .reset-btn, .save-btn {
      width: 100%;
    }
  }
</style>
