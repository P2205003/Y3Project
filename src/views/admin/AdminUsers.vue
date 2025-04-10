<template>
  <div class="admin-users">
    <div class="admin-page-header">
      <h1>User Management</h1>
      <button @click="showAddUserModal = true" class="add-user-btn">
        Add New User
      </button>
    </div>

    <!-- Search and filters -->
    <div class="admin-panel">
      <div class="search-filters">
        <div class="search-box">
          <input type="text"
                 v-model="searchQuery"
                 placeholder="Search users..."
                 @input="debounceSearch" />
        </div>
        <div class="filters">
          <select v-model="roleFilter" @change="filterUsers">
            <option value="">All Roles</option>
            <option value="true">Admins</option>
            <option value="false">Regular Users</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Users table -->
    <div class="admin-panel">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading users...</p>
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
        <button @click="fetchUsers" class="retry-btn">Try Again</button>
      </div>

      <table v-else-if="filteredUsers.length > 0" class="data-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user._id">
            <td>{{ user.username }}</td>
            <td>{{ user.fullName }}</td>
            <td>{{ user.email }}</td>
            <td>
              <span :class="['role-badge', user.isAdmin ? 'role-admin' : 'role-user']">
                {{ user.isAdmin ? 'Admin' : 'User' }}
              </span>
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td class="actions-cell">
              <button class="action-btn edit-btn" @click="editUser(user)">
                Edit
              </button>
              <button class="action-btn"
                      :class="user.isAdmin ? 'revoke-btn' : 'promote-btn'"
                      @click="toggleAdminStatus(user)">
                {{ user.isAdmin ? 'Revoke Admin' : 'Make Admin' }}
              </button>
              <button class="action-btn delete-btn" @click="confirmDeleteUser(user)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty-state">
        <p>No users found.</p>
        <p v-if="searchQuery || roleFilter !== ''">Try adjusting your search or filters.</p>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button :disabled="currentPage === 1"
                @click="changePage(currentPage - 1)"
                class="page-btn">
          Previous
        </button>
        <div class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </div>
        <button :disabled="currentPage === totalPages"
                @click="changePage(currentPage + 1)"
                class="page-btn">
          Next
        </button>
      </div>
    </div>

    <!-- Add/Edit User Modal (simplified for example) -->
    <div v-if="showAddUserModal || showEditModal" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h2>{{ showEditModal ? 'Edit User' : 'Add New User' }}</h2>
          <button class="close-modal-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>This is a placeholder for the user form.</p>
          <p>In a real implementation, this would contain a form with fields for username, email, password, etc.</p>
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeModal">Cancel</button>
            <button type="button" class="save-btn" @click="closeModal">Save User</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h2>Confirm Delete</h2>
          <button class="close-modal-btn" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete user "{{ userToDelete?.username }}"?</p>
          <p class="warning-text">This action cannot be undone.</p>
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeDeleteModal">Cancel</button>
            <button type="button" class="delete-btn" @click="deleteUser">Delete User</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminUsers',
  data() {
    return {
      users: [],
      filteredUsers: [],
      loading: true,
      error: null,
      searchQuery: '',
      roleFilter: '',
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      totalPages: 1,
      searchTimeout: null,
      // Modals
      showAddUserModal: false,
      showEditModal: false,
      editingUser: null,
      showDeleteModal: false,
      userToDelete: null
    };
  },
  created() {
    // For the sake of this example, we'll use mock data
    this.fetchUsers();
  },
  methods: {
    async fetchUsers() {
      this.loading = true;
      this.error = null;

      try {
        // In a real app, this would be an API call
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock user data
        this.users = [
          {
            _id: '1',
            username: 'admin',
            fullName: 'Admin User',
            email: 'admin@example.com',
            isAdmin: true,
            createdAt: '2023-01-15T10:30:00Z'
          },
          {
            _id: '2',
            username: 'johndoe',
            fullName: 'John Doe',
            email: 'john@example.com',
            isAdmin: false,
            createdAt: '2023-02-20T14:45:00Z'
          },
          {
            _id: '3',
            username: 'janesmith',
            fullName: 'Jane Smith',
            email: 'jane@example.com',
            isAdmin: false,
            createdAt: '2023-03-10T09:15:00Z'
          },
          {
            _id: '4',
            username: 'moderator',
            fullName: 'Moderator User',
            email: 'mod@example.com',
            isAdmin: true,
            createdAt: '2023-04-05T16:20:00Z'
          }
        ];

        // Apply filters
        this.filterUsers();
      } catch (error) {
        console.error('Error fetching users:', error);
        this.error = 'Failed to load users. Please try again.';
      } finally {
        this.loading = false;
      }
    },

    filterUsers() {
      // Apply search and role filters
      let filtered = [...this.users];

      // Search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(user =>
          user.username.toLowerCase().includes(query) ||
          user.fullName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        );
      }

      // Role filter
      if (this.roleFilter !== '') {
        const isAdmin = this.roleFilter === 'true';
        filtered = filtered.filter(user => user.isAdmin === isAdmin);
      }

      // Update pagination
      this.totalItems = filtered.length;
      this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
      this.currentPage = 1; // Reset to first page when filters change

      // Apply pagination
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      this.filteredUsers = filtered.slice(start, end);
    },

    debounceSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.filterUsers();
      }, 300);
    },

    changePage(page) {
      this.currentPage = page;
      // Apply pagination
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      this.filteredUsers = this.users.slice(start, end);
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleString();
    },

    editUser(user) {
      this.editingUser = { ...user };
      this.showEditModal = true;
    },

    toggleAdminStatus(user) {
      // This would be an API call in a real app
      user.isAdmin = !user.isAdmin;
      // Show success message
      alert(`User ${user.username} is now ${user.isAdmin ? 'an admin' : 'a regular user'}`);
    },

    confirmDeleteUser(user) {
      this.userToDelete = user;
      this.showDeleteModal = true;
    },

    deleteUser() {
      // This would be an API call in a real app
      this.users = this.users.filter(user => user._id !== this.userToDelete._id);
      this.filterUsers();
      this.closeDeleteModal();
      // Show success message
      alert(`User ${this.userToDelete.username} has been deleted`);
    },

    closeModal() {
      this.showAddUserModal = false;
      this.showEditModal = false;
      this.editingUser = null;
    },

    closeDeleteModal() {
      this.showDeleteModal = false;
      this.userToDelete = null;
    }
  }
};
</script>

<style scoped>
  .admin-users {
    width: 100%;
  }

  .admin-page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

    .admin-page-header h1 {
      margin: 0;
      font-size: 1.8rem;
      color: #333;
    }

  .add-user-btn {
    background-color: #5D5CDE;
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }

    .add-user-btn:hover {
      background-color: #4a49b8;
    }

  .admin-panel {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    margin-bottom: 1.5rem;
    padding: 1.5rem;
  }

  .search-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .search-box {
    flex: 1;
    min-width: 250px;
  }

    .search-box input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

  .filters {
    display: flex;
    gap: 1rem;
  }

    .filters select {
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      min-width: 150px;
    }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

    .data-table th,
    .data-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .data-table th {
      font-weight: 600;
      color: #333;
    }

  .role-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .role-admin {
    background-color: #e3f2fd;
    color: #1976d2;
  }

  .role-user {
    background-color: #f5f5f5;
    color: #757575;
  }

  .actions-cell {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.4rem 0.6rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .edit-btn {
    background-color: #e8f5e9;
    color: #388e3c;
  }

  .promote-btn {
    background-color: #e3f2fd;
    color: #1976d2;
  }

  .revoke-btn {
    background-color: #fff8e1;
    color: #f57c00;
  }

  .delete-btn {
    background-color: #ffebee;
    color: #d32f2f;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 1.5rem;
    gap: 1rem;
  }

  .page-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    background-color: white;
    border-radius: 4px;
    cursor: pointer;
  }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

  .page-info {
    font-size: 0.9rem;
    color: #666;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #5D5CDE;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }

  .error-message {
    padding: 1.5rem;
    background-color: #ffebee;
    color: #d32f2f;
    border-radius: 4px;
    text-align: center;
  }

  .retry-btn {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #5D5CDE;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-container {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #eee;
  }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #333;
    }

  .close-modal-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .warning-text {
    color: #d32f2f;
    font-weight: 500;
    margin-bottom: 1.5rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .cancel-btn,
  .save-btn,
  .delete-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }

  .cancel-btn {
    background-color: white;
    border: 1px solid #ddd;
    color: #666;
  }

  .save-btn {
    background-color: #5D5CDE;
    border: none;
    color: white;
  }

  .delete-btn {
    background-color: #f44336;
    border: none;
    color: white;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .admin-page-header h1 {
      color: #e2e8f0;
    }

    .admin-panel {
      background-color: #2d3748;
    }

    .search-box input,
    .filters select {
      background-color: #1a202c;
      border-color: #4a5568;
      color: #e2e8f0;
    }

    .data-table th {
      color: #e2e8f0;
    }

    .data-table th,
    .data-table td {
      border-bottom-color: #4a5568;
    }

    .role-user {
      background-color: #2d3748;
      color: #a0aec0;
    }

    .page-btn {
      background-color: #2d3748;
      border-color: #4a5568;
      color: #e2e8f0;
    }

    .page-info {
      color: #a0aec0;
    }

    .empty-state {
      color: #a0aec0;
    }

    .modal-container {
      background-color: #2d3748;
    }

    .modal-header {
      border-bottom-color: #4a5568;
    }

      .modal-header h2 {
        color: #e2e8f0;
      }

    .close-modal-btn {
      color: #a0aec0;
    }

    .warning-text {
      color: #f56565;
    }

    .cancel-btn {
      background-color: #2d3748;
      border-color: #4a5568;
      color: #e2e8f0;
    }

    /* Adjust colors for dark mode */
    .role-admin {
      background-color: rgba(25, 118, 210, 0.2);
      color: #64b5f6;
    }

    .edit-btn {
      background-color: rgba(56, 142, 60, 0.2);
      color: #81c784;
    }

    .promote-btn {
      background-color: rgba(25, 118, 210, 0.2);
      color: #64b5f6;
    }

    .revoke-btn {
      background-color: rgba(245, 124, 0, 0.2);
      color: #ffb74d;
    }

    .delete-btn {
      background-color: rgba(211, 47, 47, 0.2);
      color: #e57373;
    }

    .error-message {
      background-color: rgba(211, 47, 47, 0.2);
      color: #e57373;
    }
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .search-filters {
      flex-direction: column;
    }

    .actions-cell {
      flex-direction: column;
    }

    .action-btn {
      width: 100%;
    }

    .data-table {
      display: block;
      overflow-x: auto;
    }
  }
</style>
