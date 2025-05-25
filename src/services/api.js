import axios from "axios";
import { jwtDecode } from "jwt-decode"; // Use curly braces

const api = axios.create({
  baseURL: "http://147.93.110.150:8091/",
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Verify baseURL is set correctly
console.log('API baseURL:', api.defaults.baseURL);

// Add request interceptor to verify URL for image requests
api.interceptors.request.use((config) => {
  if (config.url?.includes('/images/')) {
    console.log('Image request URL:', config.baseURL + config.url);
  }
  
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to catch 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("401 Unauthorized error. Token might be invalid or expired.");
      // Optionally redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = async (username, password, selectedRole) => {
  const response = await api.post("/auth", { username, password, selectedRole });
  const token = response.data.token;
  console.log("Login response:", response.data); // Debug log

  if (token) {
    const decodedToken = jwtDecode(token);
    console.log("Decoded token:", decodedToken); // Debug log
    localStorage.setItem("loggedInUser", JSON.stringify(decodedToken));
    localStorage.setItem("authToken", token);
    console.log("Token stored in localStorage"); // Debug log
  } else {
    console.log("No token received in login response"); // Debug log
  }

  return response.data;
};

export const getOrders = async (date) => {
  const response = await api.get(`/allOrders?date=${date}`);
  console.log("Full API Response:", response); // Log the entire response
  console.log("response.data:", response.data);
  return response.data.data;
};

export const getUsers = async (search) => {
  const response = await api.get(
    `/allUsers${search ? `?search=${search}` : ""}`
  );
  return response.data.data;
};

export const addUser = async (userDetails) => {
  try {
    // Ensure email is properly formatted and included
    const formattedUserDetails = {
      ...userDetails,
      email: userDetails.email.trim(), // Ensure email is trimmed
      password: userDetails.username // Set initial password as username
    };
    
    const response = await api.post(`/addUser`, formattedUserDetails);
    
    if (response.data.status === true) {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to add user");
    }
  } catch (error) {
    throw error;
  }
};

// Double-check that the backend expects the role to be part of the payload
export const updateUser = async (userId, userData) => {
  console.log(userData); // Verify if role is in the request payload
  const response = await api.post(`/update?customer_id=${userId}`, userData);
  return response.data.data;
};

export const getUserBlockStatus = async (customerId) => {
  try {
    const response = await api.get(`/block-status/${customerId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting user block status:', error);
    throw error;
  }
};

export const updateUserBlockStatus = async (customerId, status) => {
  try {
    const response = await api.post('/update-block-status', {
      customer_id: customerId,
      status // should be 'active' or 'blocked'
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user block status:', error);
    throw error;
  }
};

export const getPayments = async () => {
  const response = await api.get("/payments");
  return response.data.data;
};

export const getProducts = async () => {
  console.log("Getting products with token:", localStorage.getItem("authToken")); // Debug log
  const response = await api.get("/products");
  return response.data;
};

export const addProduct = async (productData) => {
  console.log("Adding product with token:", localStorage.getItem("authToken")); // Debug log
  console.log("Product data being sent:", productData); // Debug log
  try {
    const response = await api.post("/newItem", productData);
    console.log("Add product response:", response); // Debug log
    return response.data;
  } catch (error) {
    console.error("Add product error:", error.response || error); // Debug log
    throw error;
  }
};

export const updateProduct = async (productId, productData) => {
  console.log("Updating product with token:", localStorage.getItem("authToken")); // Debug log
  console.log("Product ID:", productId); // Debug log
  console.log("Product data being sent:", productData); // Debug log
  
  try {
    // Ensure all required fields are present
    if (!productData.name || !productData.category || !productData.price) {
      throw new Error("Missing required fields: name, category, or price");
    }

    // Format the data to match backend expectations
    const formattedData = {
      ...productData,
      price: parseFloat(productData.price),
      discountPrice: productData.discountPrice ? parseFloat(productData.discountPrice) : null,
      gst_rate: productData.gst_rate ? parseFloat(productData.gst_rate) : 0,
      stock_quantity: productData.stock_quantity ? parseInt(productData.stock_quantity) : 0
    };

    const response = await api.post(`/editProd?id=${productId}`, formattedData);
    console.log("Update product response:", response); // Debug log
    return response.data;
  } catch (error) {
    console.error("Update product error:", error.response || error); // Debug log
    throw error;
  }
};

export const updateProductsByBrand = async (brand, updateData) => {
  const response = await api.patch(`/products/brand/${brand}`, updateData);
  return response.data;
};

export const saveAssignment = async (customerId, routes) => {
  try {
    console.log("Request Body:", { customerId, routes });  // Log the request body
    
    const response = await api.post("/save-assignment", {
      customerId: customerId,
      routes: routes,
    });

    if (response.data) {
      return response.data;
    } else {
      throw new Error("Invalid response from server");
    }
  } catch (error) {
    console.error("Error while saving assignment:", error);
    throw error;
  }
};

// New function to get assigned routes for a given customerId (admin)
export const getAssignedRoutes = async (customerId) => {
  try {
    console.log("Fetching assigned routes for customerId:", customerId);

    const response = await api.post("/get-all-assigned-routes", {
      customerId: customerId,
    });

    if (response.data && response.data.success) {
     
      return response.data.assignedRoutes; // Return the list of assigned routes
    } else {
      throw new Error(response.data.message || "Failed to fetch assigned routes.");
    }
  } catch (error) {
    console.error("Error fetching assigned routes:", error);
    throw error;
  }
};

// Fetch users by selected routes
export const getUniqueRoutes = async (routes) => {
  try {
    const response = await api.post("/get-unique-routes", { routes });
    return response.data;
  } catch (error) {
    console.error("Error fetching users by routes:", error);
    throw error;
  }
};

// Assign users to selected admin
export const assignUsersToAdmin = async (adminId, users) => {
  try {
    const response = await api.post("/assign-users-to-admin", { adminId, users });
    return response.data;
  } catch (error) {
    console.error("Error assigning users to admin:", error);
    throw error;
  }
};

export const getAssignedUsers = async (adminId) => {
  try {
    const response = await api.get(`/assigned-users/${adminId}`);
    return response.data; // return the response data
  } catch (error) {
    console.error("Error fetching assigned users:", error);
    throw new Error("Failed to fetch assigned users");
  }
};

export const updateOrderStatus = async (id, approve_status) => {
  try {
    const response = await api.post("/update-order-status", { id, approve_status }); // Ensure key names match API expectations
    return response.data;
  } catch (error) {
    console.error("Error updating order status:", error.response?.data || error.message);
    throw error;
  }
};

export const getAdminOrders = async (adminId, date = null) => {
  try {
    const url = `/get-admin-orders/${adminId}${date ? `?date=${date}` : ''}`;
    console.log("[DEBUG] Fetching admin orders from:", url);
    const response = await api.get(url);
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch admin orders");
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    throw new Error(error.message || "Failed to fetch admin orders");
  }
};

export const getOrderProducts = async (orderId) => {
  try {
    // **Corrected API Call:** Use query parameters instead of path parameters
    const response = await api.get(`/order-products`, { // Base path is just /order-products
      params: { // Use 'params' to send query parameters
        orderId: orderId // Send orderId as a query parameter
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching order products:", error);
    throw new Error("Failed to fetch order products");
  }
};

export const fetchMostRecentOrderApi = async (customerId, orderType) => {
  try {
    const response = await api.get(`/most-recent-order`, {
      params: {
        customerId: customerId,
        orderType: orderType, // This will be automatically added if orderType is provided
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching most recent order:", error);
    throw new Error("Failed to fetch most recent order");
  }
};

export const placeAdminOrder = async (customerId, orderType, referenceOrderId) => {
  try {
    const response = await api.post(`/on-behalf`, {
      customer_id: customerId,
      order_type: orderType,
      reference_order_id: referenceOrderId,
    });
    return response.data;
  } catch (error) {
    console.error(`Error placing ${orderType} order for customer ${customerId}:`, error);
    throw new Error(`Failed to place ${orderType} order for customer ${customerId}`);
  }
};

export const getAllOrders = async () => {
  const response = await api.get(
    `/get-all-orders`
  );
  return response.data.data;
};

export const updateOrderPrice = async (orderId, productId, newPrice) => {
  try {
    const response = await api.put(`/update_order_price/${orderId}/product/${productId}`, { newPrice });
    return response;
  } catch (error) {
    console.error('Error updating order price:', error);
    throw error;
  }
};

export const updateCustomerPrice = async (customerId, productId, customerPrice) => {
  try {
    const response = await api.post('/customer_price_update', {
      customer_id: customerId,
      product_id: productId,
      customer_price: customerPrice,
    });
    return response;
  } catch (error) {
    console.error('Error updating/adding customer price:', error);
    throw error;
  }
};

export const globalPriceUpdate = async (productId, newDiscountPrice) => {
  try {
    const response = await api.post("/global-price-update", {
      product_id: productId,
      new_discount_price: parseFloat(newDiscountPrice), // Ensure it's a number
    });
    return response;
  } catch (error) {
    console.error("Error updating global prices:", error);
    throw error;
  }
};

export const getInvoices = async (startDate = '', endDate = '') => {
  try {
    const response = await api.get('/fetch-all-invoices', {
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        startDate,
        endDate,
      },
    });
    return {
      success: true,
      data: response.data.data || [],
      message: response.data.message,
    };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Failed to fetch invoices',
    };
  }
};

export const fetchMostRecentOrdersBatchApi = async (customerIds, orderTypes) => {
  try {
      const response = await api.post('/most-recent-orders/batch', { customerIds, orderTypes });
      return response.data;
  } catch (error) {
      console.error('Error fetching batch recent orders:', error);
      throw error;
  }
};

export const getReceipts = async (startDate = '', endDate = '') => {
  try {
    const query = [];
    if (startDate) query.push(`start_date=${startDate}`);
    if (endDate) query.push(`end_date=${endDate}`);
    const url = `/fetch-all-receipts${query.length ? '?' + query.join('&') : ''}`;
    const response = await api.get(url);
    console.log("Full API Response:", response);
    console.log("response.data:", response.data);
    if (!response.data || !Array.isArray(response.data.data)) {
      throw new Error("Invalid response structure: response.data.data is not an array");
    }
    return response.data.data;
  } catch (error) {
    console.error("Error in getReceipts:", error);
    throw error;
  }
};

// In your api service file (e.g., src/services/api.js)
export const fetchProductImage = async (filename) => {
  try {
    const response = await api.get(`/images/products/${filename}`, {
      responseType: 'blob'  // Handle image as binary data
    });
    return URL.createObjectURL(response.data);
  } catch (error) {
    console.error('Error fetching product image:', error);
    throw error;
  }
};

// Upload product image
export const uploadProductImage = async (productId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await api.post(`/upload/product-image/${productId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading product image:', error);
    throw error;
  }
};

const API_BASE_URL = "http://147.93.110.150:8091";

// Helper function to get salesman image URL
export const getSalesmanImageUrl = (filename) => {
  if (!filename) return null;
  return `${API_BASE_URL}/images/salesman/${filename}`;
};

// Upload salesman image
export const uploadSalesmanImage = async (customerId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post(
      `/upload/salesman-image/${customerId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error uploading salesman image:', error);
    throw error;
  }
};

// Fetch salesman image as blob
export const fetchSalesmanImage = async (filename) => {
  try {
    const response = await api.get(getSalesmanImageUrl(filename), {
      responseType: 'blob'
    });
    return URL.createObjectURL(response.data);
  } catch (error) {
    console.error('Error fetching salesman image:', error);
    return null;
  }
};

// Improved function to construct product image URLs
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return null; // Return null instead of placeholder to trigger the fallback UI
  }
  
  // Handle if imagePath is already a full URL or blob
  if (imagePath.startsWith('http') || imagePath.startsWith('blob:')) {
    return imagePath;
  }
  
  // Ensure proper path formatting
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  return `${api.defaults.baseURL}images/products/${cleanPath}`;
};

// Get counts of different user roles
export const getUserRoleCounts = async () => {
  try {
    const response = await api.get('/user-roles-count');
    return response.data;
  } catch (error) {
    console.error('Error fetching user role counts:', error);
    throw new Error('Failed to fetch user role counts');
  }
};

// Add this to src/services/api.js
export const updateProductCode = async (prefix) => {
  try {
    const response = await api.post("/update-product-prefix", { prefix });
    return response.data;
  } catch (error) {
    console.error("Error updating product prefix:", error);
    throw error;
  }
};

// Add this new function to handle reading local files
export const readLocalFile = async (filePath) => {
  try {
    // Convert Windows path to forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    const response = await api.post('/read-local-file', {
      filePath: normalizedPath,
      allowAnyPath: true  // Add this flag to indicate we want to allow any path
    }, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error reading local file:', error);
    throw error;
  }
};

// Single function to handle all brand CRUD operations
export const manageBrand = async (operation, data = {}) => {
  try {
    const response = await api.post("/brand-crud", {
      operation,
      ...data
    });
    return response.data;
  } catch (error) {
    console.error(`Error in brand ${operation} operation:`, error);
    throw error;
  }
};

// Helper functions for specific brand operations
export const createBrand = async (name) => {
  return manageBrand('create', { name });
};

export const getBrands = async (id = null) => {
  return manageBrand('read', id ? { id } : {});
};

export const updateBrand = async (id, name) => {
  return manageBrand('update', { id, name });
};

export const deleteBrand = async (id) => {
  return manageBrand('delete', { id });
};

// Single function to handle all category CRUD operations
export const manageCategory = async (operation, data = {}) => {
  try {
    const response = await api.post("/category-crud", {
      operation,
      ...data
    });
    return response.data;
  } catch (error) {
    console.error(`Error in category ${operation} operation:`, error);
    throw error;
  }
};

// Helper functions for specific category operations
export const createCategory = async (name) => {
  return manageCategory('create', { name });
};

export const getCategories = async (id = null) => {
  return manageCategory('read', id ? { id } : {});
};

export const updateCategory = async (id, name) => {
  return manageCategory('update', { id, name });
};

export const deleteCategory = async (id) => {
  return manageCategory('delete', { id });
};

// Single function to handle all UOM CRUD operations
export const manageUOM = async (operation, data = {}) => {
  try {
    const response = await api.post("/uom-crud", {
      operation,
      ...data
    });
    return response.data;
  } catch (error) {
    console.error(`Error in UOM ${operation} operation:`, error);
    throw error;
  }
};

// Helper functions for specific UOM operations
export const createUOM = async (name) => {
  return manageUOM('create', { name });
};

export const getUOMs = async (id = null) => {
  return manageUOM('read', id ? { id } : {});
};

export const updateUOM = async (id, name) => {
  return manageUOM('update', { id, name });
};

export const deleteUOM = async (id) => {
  return manageUOM('delete', { id });
};

// Route CRUD operations
export const routeCRUD = async (operation, data = {}) => {
  try {
    const response = await api.post('/route-crud', {
      operation,
      ...data
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Single function to handle all stock group CRUD operations
export const manageStockGroup = async (operation, data = {}) => {
  try {
    console.log(`Performing stock group ${operation} operation with data:`, data);
    
    const response = await api.post("/stockgroup-crud", {
      operation,
      ...data
    });

    if (!response.data.success) {
      throw new Error(response.data.message || `Stock group ${operation} operation failed`);
    }

    return response.data;
  } catch (error) {
    console.error(`Error in stock group ${operation} operation:`, error);
    throw error.response?.data || error;
  }
};

// Helper functions for specific stock group operations
export const createStockGroup = async (name) => {
  return manageStockGroup('create', { name });
};

export const getStockGroups = async (id = null) => {
  try {
    console.log('Calling stockgroup-crud API...');
    const response = await manageStockGroup('read', id ? { id } : {});
    console.log('Stockgroup-crud API response:', response);
    
    if (!response || !response.data) {
      throw new Error('Invalid response from server');
    }
    
    return response;
  } catch (error) {
    console.error('Error in getStockGroups:', error);
    throw error;
  }
};

export const updateStockGroup = async (id, name) => {
  return manageStockGroup('update', { id, name });
};

export const deleteStockGroup = async (id) => {
  return manageStockGroup('delete', { id });
};


// Helper functions for specific salesman operations
// Get all salesmen or a single salesman
export const getSalesmen = async (searchTerm = "") => {
  try {
    const response = await api.get("/salesman-read", {
      params: searchTerm ? { search: searchTerm } : {},
    });
    if (response.data.success) {
      let salesmen = response.data.data;
      // If searchTerm, filter client-side (API does not support search param)
      if (searchTerm) {
        salesmen = salesmen.filter(salesman =>
          (salesman.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            salesman.phone?.includes(searchTerm) ||
            salesman.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            salesman.route?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      return salesmen;
    } else {
      throw new Error(response.data.message || "Failed to fetch salesmen");
    }
  } catch (error) {
    console.error("Error fetching salesmen:", error);
    throw error;
  }
};

// Create a new salesman
export const addSalesman = async (salesmanData) => {
  try {
    const response = await api.post("/salesman-create", salesmanData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a salesman
export const updateSalesman = async (customer_id, updateData) => {
  try {
    console.log('Updating salesman with:', { customer_id, updateData });
    const requestData = {
      customer_id,
      ...updateData
    };
    console.log('Request data:', requestData);
    
    const response = await api.post("/salesman-update", requestData);
    console.log('Update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Update error details:', {
      message: error.message,
      response: error.response?.data,
      requestData: { customer_id, updateData }
    });
    throw error.response?.data || error;
  }
};