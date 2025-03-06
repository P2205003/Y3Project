// src/services/orderService.js
class OrderService {
  // Create new order from cart
  async createOrder() {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Get orders with optional status filter
  async getOrders(status = null, page = 1, limit = 10) {
    try {
      let url = `/api/orders?page=${page}&limit=${limit}`;
      if (status) {
        url += `&status=${status}`;
      }

      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  // Get specific order details
  async getOrderById(orderId) {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(orderId, status, notes = '') {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status, notes })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error updating order ${orderId} status:`, error);
      throw error;
    }
  }

  // Get all orders (admin)
  async getAllOrders(filters = {}, page = 1, limit = 10) {
    try {
      let url = `/api/orders/admin/all?page=${page}&limit=${limit}`;

      // Add filters to URL
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          url += `&${key}=${value}`;
        }
      });

      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching admin orders:', error);
      throw error;
    }
  }

  // Get status options with labels for UI
  getStatusOptions() {
    return [
      { value: 'pending', label: 'Pending' },
      { value: 'shipped', label: 'Shipped' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'hold', label: 'On Hold' },
      { value: 'delivered', label: 'Delivered' }
    ];
  }

  // Get allowed transitions for the current status
  getAllowedTransitions(currentStatus) {
    const transitions = {
      'pending': ['shipped', 'cancelled', 'hold'],
      'hold': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'cancelled': [],
      'delivered': []
    };

    return transitions[currentStatus] || [];
  }

  // Format date in a user-friendly way
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  }
}

const orderService = new OrderService();
export default orderService;
