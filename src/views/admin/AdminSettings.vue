<template>
  <div class="admin-settings">
    <div class="admin-page-header">
      <h1>Admin Settings</h1>
      <!-- No primary action button needed here typically -->
    </div>

    <div class="admin-panel settings-panel">
      <!-- Removed h2 as admin-panel usually implies a content block -->
      <form @submit.prevent="saveSettings" class="settings-form">
        <!-- General Settings Section -->
        <div class="form-section">
          <h3><font-awesome-icon icon="cog" /> General Settings</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="site-name">Site Name</label>
              <input type="text" id="site-name" v-model="settings.siteName" class="enhanced-input" placeholder="e.g., AURORA Furnishings" />
            </div>
            <div class="form-group">
              <label for="contact-email">Public Contact Email</label>
              <input type="email" id="contact-email" v-model="settings.contactEmail" class="enhanced-input" placeholder="e.g., support@example.com" />
            </div>
          </div>
          <div class="form-group">
            <label for="site-description">Site Description (for SEO)</label>
            <textarea id="site-description"
                      v-model="settings.siteDescription"
                      rows="3"
                      class="enhanced-textarea"
                      placeholder="Briefly describe your store..."></textarea>
          </div>
        </div>

        <!-- Display Options Section -->
        <div class="form-section">
          <h3><font-awesome-icon icon="desktop" /> Display Options</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="products-per-page">Products Per Page (Shop)</label>
              <input type="number"
                     id="products-per-page"
                     v-model.number="settings.productsPerPage"
                     min="4"
                     max="48"
                     step="4"
                     class="enhanced-input" />
            </div>
            <div class="form-group checkbox-group">
              <input type="checkbox"
                     id="show-out-of-stock"
                     v-model="settings.showOutOfStock" />
              <label for="show-out-of-stock">Show Out-of-Stock Products</label>
              <span class="help-text">(If checked, they appear grayed out)</span>
            </div>
            <div class="form-group checkbox-group">
              <input type="checkbox"
                     id="enable-reviews"
                     v-model="settings.enableReviews" />
              <label for="enable-reviews">Enable Product Reviews</label>
            </div>
            <!-- Dark mode toggle removed - handled by OS pref or dedicated toggle -->
          </div>
        </div>

        <!-- Notification Settings Section -->
        <div class="form-section">
          <h3><font-awesome-icon icon="bell" /> Notification Settings</h3>
          <p class="section-description">Configure email notifications for admin actions.</p>
          <div class="form-grid">
            <div class="form-group checkbox-group">
              <input type="checkbox"
                     id="order-notifications"
                     v-model="settings.notifications.orders" />
              <label for="order-notifications">Notify on New Orders</label>
            </div>
            <div class="form-group checkbox-group">
              <input type="checkbox"
                     id="user-notifications"
                     v-model="settings.notifications.users" />
              <label for="user-notifications">Notify on New User Registration</label>
            </div>
            <div class="form-group checkbox-group">
              <input type="checkbox"
                     id="review-notifications"
                     v-model="settings.notifications.reviews" />
              <label for="review-notifications">Notify on New Reviews</label>
            </div>
            <!-- Low stock removed - potentially complex, maybe separate inventory section -->
          </div>
        </div>

        <!-- Advanced Settings Section -->
        <div class="form-section">
          <h3><font-awesome-icon icon="tools" /> Advanced Settings</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="maintenance-mode">Maintenance Mode</label>
              <select id="maintenance-mode" v-model="settings.maintenanceMode" class="enhanced-input">
                <option value="off">Off (Live)</option>
                <option value="on">On (Site Unavailable)</option>
                <!-- Scheduled removed for simplicity, can be complex -->
              </select>
              <span class="help-text">(Puts the customer-facing site offline)</span>
            </div>
            <div class="form-group">
              <label for="api-key">API Key (Read Only)</label>
              <div class="api-key-container">
                <input type="text"
                       id="api-key"
                       v-model="settings.apiKey"
                       class="enhanced-input"
                       readonly
                       title="Read-only API key for external integrations" />
                <button type="button"
                        class="button enhanced-button secondary regenerate-btn"
                        @click="regenerateApiKey">
                  <font-awesome-icon icon="sync-alt" /> Regenerate
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" class="button enhanced-button secondary reset-btn" @click="resetSettings">Reset Defaults</button>
          <button type="submit" class="button enhanced-button primary save-btn" :disabled="isSaving">
            <font-awesome-icon icon="spinner" spin v-if="isSaving" />
            <font-awesome-icon icon="save" v-else />
            {{ isSaving ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { library } from '@fortawesome/fontawesome-svg-core';
  import { faCog, faDesktop, faBell, faTools, faSave, faSpinner, faSyncAlt } from '@fortawesome/free-solid-svg-icons'; // Added icons

  library.add(faCog, faDesktop, faBell, faTools, faSave, faSpinner, faSyncAlt);

  // --- State ---
  const isSaving = ref(false);
  const settings = ref({
    siteName: 'AURORA Furnishings',
    siteDescription: 'Sustainable Craftsmanship, Illuminated Design. Explore furniture crafted from responsibly sourced materials.',
    contactEmail: 'support@aurora.example',
    productsPerPage: 12,
    showOutOfStock: true,
    enableReviews: true, // Added review toggle
    notifications: {
      orders: true,
      users: false,
      reviews: true // Added review notification
    },
    maintenanceMode: 'off',
    apiKey: 'sk_live_************************' // Placeholder
  });
  const defaultSettings = ref({}); // To store initial/default values

  // --- Methods ---
  const fetchSettings = async () => {
    // TODO: Replace with actual API call to load settings from backend
    console.log("Fetching settings (mock)...");
    await new Promise(resolve => setTimeout(resolve, 300));
    // Save initial state as default for reset functionality
    defaultSettings.value = JSON.parse(JSON.stringify(settings.value));
    console.log("Settings loaded (mock).");
  };

  const saveSettings = async () => {
    isSaving.value = true;
    console.log("Saving settings (mock):", settings.value);
    try {
      // TODO: Replace with actual API call to save settings to backend
      await new Promise(resolve => setTimeout(resolve, 1200));
      // Update default settings upon successful save
      defaultSettings.value = JSON.parse(JSON.stringify(settings.value));
      alert('Settings saved successfully!'); // Simple feedback
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.'); // Simple feedback
    } finally {
      isSaving.value = false;
    }
  };

  const resetSettings = () => {
    if (confirm('Are you sure you want to discard changes and reset to default settings?')) {
      settings.value = JSON.parse(JSON.stringify(defaultSettings.value));
      alert('Settings reset to defaults.');
    }
  };

  const regenerateApiKey = () => {
    if (confirm('Are you sure you want to regenerate the API key? The current key will be invalidated immediately.')) {
      isSaving.value = true; // Use saving indicator
      console.log("Regenerating API key (mock)...");
      // TODO: Replace with actual API call to regenerate key on backend
      setTimeout(() => {
        settings.value.apiKey = 'sk_live_' + Array(24).fill('*').join(''); // Show placeholder immediately
        // Simulate backend update and fetching new key
        setTimeout(() => {
          // This would normally come from the backend response
          settings.value.apiKey = 'sk_live_newkey_' + Math.random().toString(36).substring(2, 10);
          defaultSettings.value.apiKey = settings.value.apiKey; // Update default
          isSaving.value = false;
          alert('API Key regenerated successfully!');
        }, 800);
      }, 500);
    }
  };

  // --- Lifecycle ---
  onMounted(() => {
    fetchSettings();
  });
</script>

<style scoped>
  .admin-settings {
    width: 100%;
  }

  .settings-panel {
    max-width: auto;
    margin-left: auto;
    margin-right: auto;
  }

  .settings-form {
    display: flex;
    flex-direction: column;
    gap: 2rem; /* Space between form sections */
  }

  .form-section {
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 2rem;
  }

    .form-section:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .form-section h3 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      font-size: 1.2rem;
      color: var(--text-dark);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.6em;
      border-bottom: 1px solid var(--border-color); /* Add underline to section titles */
      padding-bottom: 0.6rem;
    }

      .form-section h3 .svg-inline--fa {
        color: var(--primary); /* Icon color */
      }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem; /* Gap between items in the grid */
  }

  .form-group {
    margin-bottom: 0; /* Remove bottom margin as grid gap handles spacing */
  }

    .form-group label {
      /* Inherited */
    }

    /* Use enhanced styles from main.css */
    .form-group .enhanced-input,
    .form-group .enhanced-textarea,
    .form-group select {
      /* Inherited */
    }

  .checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.5rem; /* Add some top margin */
  }

    .checkbox-group label {
      margin-bottom: 0;
      font-weight: 500; /* Less emphasis */
    }

    .checkbox-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--primary); /* Style checkbox */
      margin-top: -2px; /* Align better with label */
    }

  .help-text {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 0.4rem;
    display: block; /* Ensure it takes its own line */
  }

  .section-description {
    font-size: 0.9rem;
    color: var(--text-muted);
    margin-top: -1rem; /* Pull up below heading */
    margin-bottom: 1.5rem;
  }

  .api-key-container {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

    .api-key-container input {
      flex: 1;
      background-color: var(--bg-light); /* Indicate read-only */
      font-family: monospace;
      font-size: 0.9rem;
      color: var(--text-muted);
    }

  .regenerate-btn {
    padding: 0.75rem 1rem; /* Match input height */
    flex-shrink: 0; /* Prevent shrinking */
  }

    .regenerate-btn svg {
      margin-right: 0.5em;
    }


  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem; /* Reduced top margin */
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
  }

  .reset-btn {
    /* Uses secondary styles */
  }

  .save-btn {
    /* Uses primary styles */
  }

    .save-btn svg {
      margin-right: 0.5em;
    }

  /* Responsive */
  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr; /* Stack grid items */
      gap: 1rem;
    }

    .form-actions {
      flex-direction: column-reverse; /* Stack buttons, Save on top */
      align-items: stretch;
    }

      .form-actions .button {
        width: 100%;
      }
  }
</style>
