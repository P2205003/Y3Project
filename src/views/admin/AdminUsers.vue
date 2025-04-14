<template>
  <div class="admin-users">
    <div class="admin-page-header">
      <h1>User Management</h1>
      <button @click="openAddUserModal" class="button enhanced-button primary">
        <font-awesome-icon icon="user-plus" /> Add New User
      </button>
    </div>

    <!-- Search and filters panel -->
    <div class="admin-panel filters-panel">
      <div class="filters-container">
        <div class="filter-group search-group">
          <label for="user-search">
            <font-awesome-icon icon="search" /> Search Users
          </label>
          <input type="search"
                 id="user-search"
                 v-model="searchQuery"
                 placeholder="Search by username, name, or email..."
                 @input="debounceSearch"
                 class="enhanced-input" />
        </div>
        <div class="filter-group role-filter-group">
          <label for="role-filter">
            <font-awesome-icon icon="user-tag" /> Role
          </label>
          <select id="role-filter" v-model="roleFilter" @change="filterUsers" class="enhanced-input">
            <option value="">All Roles</option>
            <option value="true">Admins</option>
            <option value="false">Regular Users</option>
          </select>
        </div>
        <div class="filter-actions">
          <button @click="resetFilters" class="button enhanced-button secondary" :disabled="loading">
            <font-awesome-icon icon="times-circle" /> Reset Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Users table panel -->
    <div class="admin-panel users-table-panel">
      <!-- No h2 needed here -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading users...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <p>{{ error }}</p>
        <button @click="fetchUsers" class="button enhanced-button secondary">Try Again</button>
      </div>

      <div v-else>
        <div v-if="filteredUsers.length > 0" class="table-responsive-wrapper">
          <table class="data-table users-data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th class="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user._id">
                <td>{{ user.username }}</td>
                <td>{{ user.fullName }}</td>
                <td>
                  <a :href="`mailto:${user.email}`" class="email-link">{{ user.email }}</a>
                </td>
                <td>
                  <span :class="['role-badge', user.isAdmin ? 'role-admin' : 'role-user']">
                    {{ user.isAdmin ? 'Admin' : 'User' }}
                  </span>
                </td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <td class="actions-cell">
                  <button class="action-btn edit-btn" @click="editUser(user)" title="Edit User">
                    <font-awesome-icon icon="edit" />
                  </button>
                  <button class="action-btn"
                          :class="user.isAdmin ? 'revoke-btn' : 'promote-btn'"
                          @click="toggleAdminStatus(user)"
                          :title="user.isAdmin ? 'Revoke Admin Privileges' : 'Make Admin'">
                    <font-awesome-icon :icon="user.isAdmin ? 'user-minus' : 'user-shield'" />
                  </button>
                  <button class="action-btn delete-btn" @click="confirmDeleteUser(user)" title="Delete User">
                    <font-awesome-icon icon="trash" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty-state">
          <p>No users found.</p>
          <p v-if="searchQuery || roleFilter !== ''">Try adjusting your search or role filter.</p>
        </div>

        <!-- Pagination -->
        <nav v-if="totalPages > 1" class="pagination users-pagination" aria-label="Users list pagination">
          <button :disabled="currentPage === 1 || loading"
                  @click="changePage(currentPage - 1)"
                  class="page-btn">
            Previous
          </button>
          <div class="page-info">
            Page {{ currentPage }} of {{ totalPages }} ({{ totalItems }} users)
          </div>
          <button :disabled="currentPage === totalPages || loading"
                  @click="changePage(currentPage + 1)"
                  class="page-btn">
            Next
          </button>
        </nav>
      </div>
    </div>

    <!-- Add/Edit User Modal (Still simplified - needs full form implementation) -->
    <div v-if="showAddUserModal || showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h2>{{ modalTitle }}</h2>
          <button class="close-modal-btn" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="saveUser">
          <div class="modal-body">
            <!-- Basic Form Fields (Expand this in a real app) -->
            <div class="form-group">
              <label for="modal-username">Username</label>
              <input type="text" id="modal-username" v-model="currentUserData.username" class="enhanced-input" required :readonly="showEditModal">
            </div>
            <div class="form-group">
              <label for="modal-fullname">Full Name</label>
              <input type="text" id="modal-fullname" v-model="currentUserData.fullName" class="enhanced-input" required>
            </div>
            <div class="form-group">
              <label for="modal-email">Email</label>
              <input type="email" id="modal-email" v-model="currentUserData.email" class="enhanced-input" required>
            </div>
            <div class="form-group" v-if="showAddUserModal">
              <label for="modal-password">Password</label>
              <input type="password" id="modal-password" v-model="currentUserData.password" class="enhanced-input" required placeholder="Enter new password">
            </div>
            <div class="form-group">
              <label for="modal-shipping">Shipping Address</label>
              <textarea id="modal-shipping" v-model="currentUserData.shippingAddress" class="enhanced-textarea" rows="3" required></textarea>
            </div>
            <div class="form-group checkbox-group">
              <input type="checkbox" id="modal-isadmin" v-model="currentUserData.isAdmin" />
              <label for="modal-isadmin">Is Admin?</label>
            </div>
            <p v-if="modalError" class="modal-error-text">{{ modalError }}</p>
          </div>
          <div class="modal-actions">
            <button type="button" class="button enhanced-button secondary" @click="closeModal">Cancel</button>
            <button type="submit" class="button enhanced-button primary" :disabled="isSaving">
              {{ isSaving ? 'Saving...' : (showAddUserModal ? 'Add User' : 'Save Changes') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-container delete-modal">
        <div class="modal-header">
          <h2>Confirm Deletion</h2>
          <button class="close-modal-btn" @click="closeDeleteModal">×</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to permanently delete user <strong>"{{ userToDelete?.username }}"</strong>?</p>
          <p class="warning-text">This action cannot be undone.</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="button enhanced-button secondary" @click="closeDeleteModal">Cancel</button>
          <button type="button" class="button enhanced-button danger" @click="deleteUserConfirmed" :disabled="isDeleting">
            <font-awesome-icon icon="spinner" spin v-if="isDeleting" />
            {{ isDeleting ? 'Deleting...' : 'Yes, Delete User' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { debounce } from 'lodash-es';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { library } from '@fortawesome/fontawesome-svg-core';
  import {
    faUserPlus, faSearch, faUserTag, faTimesCircle, faRotateRight,
    faEdit, faTrash, faUserShield, faUserMinus, faSpinner, faCalendarAlt, faEye // Added icons
  } from '@fortawesome/free-solid-svg-icons';

  // Add required icons
  library.add(
    faUserPlus, faSearch, faUserTag, faTimesCircle, faRotateRight, faEdit,
    faTrash, faUserShield, faUserMinus, faSpinner, faCalendarAlt, faEye
  );

  // --- State ---
  const users = ref([]);
  const filteredUsers = ref([]);
  const loading = ref(true);
  const error = ref(null);
  const searchQuery = ref('');
  const roleFilter = ref(''); // '' for all, 'true' for admin, 'false' for user
  const currentPage = ref(1);
  const itemsPerPage = ref(10);
  const totalItems = ref(0);
  const totalPages = ref(1);
  const searchTimeout = ref(null);

  // Modal States
  const showAddUserModal = ref(false);
  const showEditModal = ref(false);
  const showDeleteModal = ref(false);
  const isSaving = ref(false);
  const isDeleting = ref(false);
  const currentUserData = ref({}); // For add/edit form
  const userToDelete = ref(null);
  const modalError = ref(null); // Error specific to modal operations

  const route = useRoute();
  const router = useRouter();

  // --- Computed Properties ---
  const hasActiveFilters = computed(() => {
    return searchQuery.value || roleFilter.value !== '';
  });
  const modalTitle = computed(() => showEditModal.value ? 'Edit User' : 'Add New User');

  // --- Methods ---
  const fetchUsers = async () => {
    loading.value = true;
    error.value = null;
    try {
      // --- MOCK API Call ---
      await new Promise(resolve => setTimeout(resolve, 700));
      // In a real app: const response = await fetch('/api/admin/users'); ... data = await response.json();
      // --- Mock Data ---
      users.value = [
        { _id: '1', username: 'admin_aura', fullName: 'Aurora Admin', email: 'admin@aurorafurnishings.example', isAdmin: true, createdAt: '2024-01-10T10:00:00Z', shippingAddress: '123 Admin St, Anytown USA' },
        { _id: '2', username: 'sarah_j', fullName: 'Sarah Jones', email: 'sarah.j@email.com', isAdmin: false, createdAt: '2024-02-15T14:30:00Z', shippingAddress: '456 Customer Ave, Somewhere City' },
        { _id: '3', username: 'mike_dev', fullName: 'Mike Developer', email: 'mike.dev@tech.co', isAdmin: true, createdAt: '2024-03-01T08:00:00Z', shippingAddress: '789 Tech Blvd, Silicon Valley' },
        { _id: '4', username: 'lisa_m', fullName: 'Lisa Miller', email: 'lisa.m@provider.net', isAdmin: false, createdAt: '2024-05-20T11:22:33Z', shippingAddress: '101 Sample Rd, Testville' },
        { _id: '5', username: 'david_c', fullName: 'David Chen', email: 'd.chen@mail.org', isAdmin: false, createdAt: '2024-06-05T18:05:00Z', shippingAddress: '222 User Ln, Placeburg' },
      ];
      // --- End Mock Data ---

      applyFiltersAndPagination(); // Filter and paginate the fetched data
    } catch (err) {
      console.error('Error fetching users:', err);
      error.value = 'Failed to load users. Please try again.';
      users.value = [];
      applyFiltersAndPagination(); // Ensure UI updates even on error
    } finally {
      loading.value = false;
    }
  };

  const applyFiltersAndPagination = () => {
    let tempFiltered = [...users.value];

    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      tempFiltered = tempFiltered.filter(user =>
        user.username.toLowerCase().includes(query) ||
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter.value !== '') {
      const isAdmin = roleFilter.value === 'true';
      tempFiltered = tempFiltered.filter(user => user.isAdmin === isAdmin);
    }

    // Update pagination totals
    totalItems.value = tempFiltered.length;
    totalPages.value = Math.ceil(totalItems.value / itemsPerPage.value);

    // Clamp current page
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value || 1;
    }

    // Apply pagination
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    filteredUsers.value = tempFiltered.slice(start, end);

    // Update URL (optional)
    // updateURLQueryParams();
  };

  const debounceSearch = debounce(() => {
    currentPage.value = 1;
    applyFiltersAndPagination();
  }, 500);

  const filterUsers = () => {
    currentPage.value = 1;
    applyFiltersAndPagination();
  };

  const resetFilters = () => {
    searchQuery.value = '';
    roleFilter.value = '';
    filterUsers(); // This will reset page and apply
  };

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
      applyFiltersAndPagination();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-CA'); // YYYY-MM-DD
  };

  const openAddUserModal = () => {
    currentUserData.value = { username: '', fullName: '', email: '', password: '', shippingAddress: '', isAdmin: false }; // Reset form
    showEditModal.value = false;
    showAddUserModal.value = true;
    modalError.value = null;
  };

  const editUser = (user) => {
    currentUserData.value = { ...user }; // Copy user data for editing
    showAddUserModal.value = false;
    showEditModal.value = true;
    modalError.value = null;
  };

  const closeModal = () => {
    showAddUserModal.value = false;
    showEditModal.value = false;
    currentUserData.value = {};
    modalError.value = null;
  };

  const saveUser = async () => {
    isSaving.value = true;
    modalError.value = null;
    try {
      // --- MOCK API CALL ---
      await new Promise(resolve => setTimeout(resolve, 800));
      // In a real app: const url = showAddUserModal.value ? '/api/admin/users' : `/api/admin/users/${currentUserData.value._id}`;
      // In a real app: const method = showAddUserModal.value ? 'POST' : 'PUT';
      // In a real app: const response = await fetch(url, { method, body: JSON.stringify(currentUserData.value), ... });
      // Handle response...

      console.log('Saving user (mock):', currentUserData.value);
      // --- Mock Success ---
      await fetchUsers(); // Refetch to see changes (or update locally for faster UI)
      closeModal();
      alert(`User ${showAddUserModal.value ? 'added' : 'updated'} successfully!`);

    } catch (err) {
      console.error('Error saving user:', err);
      modalError.value = err.message || `Failed to ${showAddUserModal.value ? 'add' : 'update'} user.`;
    } finally {
      isSaving.value = false;
    }
  };

  const toggleAdminStatus = async (user) => {
    const originalStatus = user.isAdmin;
    const action = originalStatus ? 'revoke admin status for' : 'make';
    if (!confirm(`Are you sure you want to ${action} user "${user.username}"?`)) return;

    // Optimistic UI update
    user.isAdmin = !originalStatus;
    applyFiltersAndPagination(); // Re-filter if role filter is active

    try {
      // --- MOCK API CALL ---
      await new Promise(resolve => setTimeout(resolve, 500));
      // In a real app: const response = await fetch(`/api/admin/users/${user._id}/toggle-admin`, { method: 'PATCH', ... });
      console.log(`Toggled admin status for ${user.username} (mock)`);
      // --- Mock Success ---
      // Optional: Refetch or rely on optimistic update
      // alert(`Admin status for ${user.username} updated.`);
    } catch (err) {
      console.error('Error toggling admin status:', err);
      // Revert UI on error
      user.isAdmin = originalStatus;
      applyFiltersAndPagination();
      alert(err.message || 'Failed to update user role.');
    }
  };

  const confirmDeleteUser = (user) => {
    userToDelete.value = user;
    showDeleteModal.value = true;
  };

  const closeDeleteModal = () => {
    showDeleteModal.value = false;
    userToDelete.value = null;
  };

  const deleteUserConfirmed = async () => {
    if (!userToDelete.value) return;
    isDeleting.value = true;
    error.value = null; // Clear main page error

    try {
      // --- MOCK API CALL ---
      await new Promise(resolve => setTimeout(resolve, 600));
      // In a real app: const response = await fetch(`/api/admin/users/${userToDelete.value._id}`, { method: 'DELETE', ... });
      console.log(`Deleted user ${userToDelete.value.username} (mock)`);
      // --- Mock Success ---
      users.value = users.value.filter(u => u._id !== userToDelete.value._id);
      applyFiltersAndPagination(); // Refilter and paginate
      closeDeleteModal();
      alert(`User "${userToDelete.value.username}" deleted successfully.`);

    } catch (err) {
      console.error('Error deleting user:', err);
      error.value = err.message || 'Failed to delete user.'; // Show error on main page
      alert(`Error: ${error.value}`);
      closeDeleteModal(); // Close modal even on error
    } finally {
      isDeleting.value = false;
    }
  };

  // --- Lifecycle Hooks ---
  onMounted(() => {
    // Read initial filters from URL? (Optional for users page)
    fetchUsers();
  });

</script>

<style scoped>
  /* Use shared admin styles from main.css */
  .admin-users {
    width: 100%;
  }

  /* Specific layout adjustments */
  .filters-panel .filters-container {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Adjust min width */
  }

  .filters-panel .filter-actions {
    grid-column: auto; /* Don't force span on smaller layouts */
    justify-self: end; /* Align button group to the right end */
  }

  .table-responsive-wrapper {
    width: 100%;
    overflow-x: auto;
  }

  .users-data-table th, .users-data-table td {
    white-space: nowrap;
  }

    .users-data-table td:nth-child(2), /* Full Name */
    .users-data-table td:nth-child(3) /* Email */ {
      white-space: normal;
      word-break: break-word;
    }

  .email-link {
    color: var(--primary);
    text-decoration: none;
  }

    .email-link:hover {
      text-decoration: underline;
    }

  .actions-header {
    text-align: right;
  }

  .actions-cell {
    text-align: right;
  }

  .action-btn {
    /* Styles inherited */
  }

    .action-btn svg {
      /* No margin needed if using buttons without text */
    }

  /* Ensure checkbox + label alignment */
  .checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem; /* Add some space */
  }

    .checkbox-group label {
      margin-bottom: 0; /* Remove bottom margin */
      font-weight: 500;
    }

    .checkbox-group input[type="checkbox"] {
      width: auto; /* Let checkbox size naturally */
      height: auto;
      accent-color: var(--primary); /* Style checkbox */
    }

  /* Modal Specific */
  .modal-body .form-group:last-of-type {
    margin-bottom: 0; /* No extra margin below last form item */
  }

  .modal-error-text {
    color: var(--secondary);
    font-size: 0.85rem;
    margin-top: 1rem;
    text-align: center;
  }

  .delete-modal .modal-body p {
    text-align: center;
    margin-bottom: 0.75rem;
  }

  .delete-modal .modal-body strong {
    color: var(--text-dark);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .filters-panel .filter-actions {
      justify-self: stretch; /* Allow buttons to stretch */
      width: 100%;
    }

    .filter-actions .button {
      flex-grow: 1; /* Make buttons take equal space */
    }

    .actions-cell {
      white-space: nowrap; /* Prevent buttons wrapping aggressively */
    }

    .action-btn {
      padding: 0.5rem; /* Slightly larger touch target */
    }
  }
</style>
