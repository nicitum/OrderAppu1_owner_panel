import React, { useState, useEffect } from "react";
import {
  getUsers,
  toggleUserBlock,
  updateUser,
  addUser,
  getAssignedUsers,
  getUserRoleCounts,
  routeCRUD,
} from "../services/api";
import toast from "react-hot-toast";
import SearchBar from "./UsersTab/SearchBar";
import UserTable from "./UsersTab/UserTable";
import EditUserModal from "./UsersTab/EditUserModal";
import axios from "axios";
import * as XLSX from 'xlsx';
import { Plus } from 'lucide-react';

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddSalesManagerModal, setShowAddSalesManagerModal] = useState(false);
  const [isCheckingLimits, setIsCheckingLimits] = useState(false);
  const [clientPrefixes, setClientPrefixes] = useState({
    customer_prefix: "",
    sm_prefix: "",
    superadmin_prefix: ""
  });
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [routes, setRoutes] = useState([]);
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');

  // Form states for both edit and add
  const initialFormState = {
    username: "",
    customer_id: "",
    phone: "",
    password: "",
    name: "",
    route: "",
    delivery_address: "",
    gst_number: "",
    address_line1: "",
    address_line2: "",
    address_line3: "",
    address_line4: "",
    city: "",
    state: "",
    zip_code: "",
    role: "user",
  };

  const [editForm, setEditForm] = useState(initialFormState);
  const [newUser, setNewUser] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

  // Fetch client prefixes
  const fetchClientPrefixes = async () => {
    try {
      const response = await axios.get('http://147.93.110.150:3001/api/client_status/APPU0009');
      if (response.data.success && response.data.data.length > 0) {
        const clientData = response.data.data[0];
        setClientPrefixes({
          customer_prefix: clientData.customer_prefix,
          sm_prefix: clientData.sm_prefix,
          superadmin_prefix: clientData.superadmin_prefix
        });
      }
    } catch (error) {
      console.error("Error fetching client prefixes:", error);
      toast.error("Failed to fetch client prefixes");
    }
  };

  useEffect(() => {
    fetchClientPrefixes();
  }, []);

  // Generate customer ID with prefix
  const generateCustomerId = async (prefix) => {
    try {
      // Get all users to find the highest number for this specific prefix
      const allUsers = await getUsers();
      
      // Filter users with the given prefix and extract numbers
      const prefixUsers = allUsers.filter(user => 
        user.customer_id && user.customer_id.startsWith(prefix)
      );
      
      const numbers = prefixUsers.map(user => {
        const num = parseInt(user.customer_id.replace(prefix, ''));
        return isNaN(num) ? 0 : num;
      });
      
      // Find the highest number and increment by 1
      const maxNumber = Math.max(0, ...numbers);
      const nextNumber = maxNumber + 1;
      
      // Format the number with leading zeros (4 digits)
      return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error("Error generating customer ID:", error);
      toast.error("Failed to generate customer ID");
      return `${prefix}0001`; // Fallback to 0001 if there's an error
    }
  };

  // Fetch users with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchUsers = async (search) => {
    setIsLoading(true);
    try {
      if (loggedInUser?.role === "superadmin") {
        const data = await getUsers(search);
        setUsers(data);
      } else if (loggedInUser?.role === "admin") {
        const result = await getAssignedUsers(loggedInUser.id1);
        if (result.success) {
          setUsers(result.assignedUsers);
        } else {
          setUsers([]);
          toast.error(result.message || "Failed to fetch assigned users");
        }
      }
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBlock = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === "Block" ? "Active" : "Block";
      await toggleUserBlock(userId, newStatus);
      fetchUsers(searchTerm);
      toast.success(
        `User ${newStatus === "Block" ? "blocked" : "activated"} successfully`
      );
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username || "",
      customer_id: user.customer_id || "",
      phone: user.phone || "",
      password: "",
      name: user.name || "",
      route: user.route || "",
      delivery_address: user.delivery_address || "",
      gst_number: user.gst_number || "",
      address_line1: user.address_line1 || "",
      address_line2: user.address_line2 || "",
      address_line3: user.address_line3 || "",
      address_line4: user.address_line4 || "",
      city: user.city || "",
      state: user.state || "",
      zip_code: user.zip_code || "",
      role: user.role || "user",
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault(); // Prevent default form submission
    
    if (!validateForm(editForm)) return;
    
    try {
      await updateUser(selectedUser.customer_id, editForm);
      fetchUsers(searchTerm);
      setSelectedUser(null);
      toast.success("User updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user");
    }
  };

  const validateForm = (formData) => {
    const errors = {};

    if (!formData.name) errors.name = "Name is required";
    if (!formData.phone) errors.phone = "Phone is required";
    if (!formData.route) errors.route = "Route is required";
    if (!formData.city) errors.city = "City is required";
    if (!formData.state) errors.state = "State is required";
    if (!formData.zip_code) errors.zip_code = "Zip code is required";
    if (!formData.username) errors.username = "Username is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkUserLimits = async () => {
    try {
      setIsCheckingLimits(true);
      const [roleCountsResponse, clientStatusResponse] = await Promise.all([
        getUserRoleCounts(),
        axios.get('http://147.93.110.150:3001/api/client_status/APPU0009')
      ]);

      if (!roleCountsResponse.success || !clientStatusResponse.data.success) {
        toast.error("Failed to fetch role counts. Please try again.");
        return false;
      }

      const roleCounts = roleCountsResponse.data;
      const clientStatus = clientStatusResponse.data.data[0];

      // Only check user/customer login limit
      const currentUserCount = roleCounts.user;
      const allowedUserCount = clientStatus.customers_login;

      if (currentUserCount >= allowedUserCount) {
        toast.error("Maximum user limit reached. Please upgrade your plan or contact administrator.");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking user limits:", error);
      toast.error("Failed to check user limits. Please try again.");
      return false;
    } finally {
      setIsCheckingLimits(false);
    }
  };

  const handleAddSalesManagerClick = async () => {
    const canAddUser = await checkUserLimits();
    if (canAddUser) {
      // Generate customer_id with prefix when opening the modal
      const newCustomerId = await generateCustomerId(clientPrefixes.sm_prefix);
      setNewUser(prev => ({
        ...prev,
        customer_id: newCustomerId,
        role: 'admin' // Set role as admin by default
      }));
      setShowAddSalesManagerModal(true);
    }
  };

  const handleAddUserClick = async () => {
    const canAddUser = await checkUserLimits();
    if (canAddUser) {
      // Generate customer_id with prefix when opening the modal
      const newCustomerId = await generateCustomerId(clientPrefixes.customer_prefix);
      setNewUser(prev => ({
        ...prev,
        customer_id: newCustomerId
      }));
      setShowAddModal(true);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm(newUser)) return;
    
    try {
      setIsLoading(true);

      // First check role counts from both APIs
      const [roleCountsResponse, clientStatusResponse] = await Promise.all([
        getUserRoleCounts(),
        axios.get('http://147.93.110.150:3001/api/client_status/APPU0009')
      ]);

      if (!roleCountsResponse.success || !clientStatusResponse.data.success) {
        toast.error("Failed to fetch role counts. Please try again.");
        return;
      }

      const roleCounts = roleCountsResponse.data;
      const clientStatus = clientStatusResponse.data.data[0];

      // Map the counts for comparison
      const currentCounts = {
        user: roleCounts.user,
        admin: roleCounts.admin
      };

      const allowedCounts = {
        user: clientStatus.customers_login,
        admin: clientStatus.sales_mgr_login
      };

      // Check if adding one more user would exceed the limit
      if (currentCounts.user >= allowedCounts.user) {
        toast.error("Maximum user limit reached. Please upgrade your plan or contact administrator.");
        return;
      }

      if (newUser.role === 'admin' && currentCounts.admin >= allowedCounts.admin) {
        toast.error("Maximum admin limit reached. Please upgrade your plan or contact administrator.");
        return;
      }

      // If all checks pass, proceed with user creation
      const userData = {
        ...newUser,
        phone: String(newUser.phone).trim(),
        password: newUser.username
      };
      
      await addUser(userData);
      await fetchUsers(searchTerm);
      setShowAddModal(false);
      setShowAddSalesManagerModal(false);
      resetNewUserForm();
      toast.success("User added successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add user");
      console.error("Add user error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetNewUserForm = () => {
    setNewUser(initialFormState);
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      toast.error("Please select an Excel file");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Read the Excel file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Validate the data
          const requiredFields = ['username', 'name', 'phone', 'route', 'city', 'state', 'zip_code'];
          const invalidRows = [];
          const validRows = [];

          jsonData.forEach((row, index) => {
            // Convert all values to strings and trim them
            const processedRow = {};
            Object.keys(row).forEach(key => {
              processedRow[key] = row[key] ? String(row[key]).trim() : '';
            });

            // Check for missing or empty required fields
            const missingFields = requiredFields.filter(field => !processedRow[field]);
            if (missingFields.length > 0) {
              invalidRows.push({ row: index + 2, missingFields });
            } else {
              validRows.push(processedRow);
            }
          });

          if (invalidRows.length > 0) {
            toast.error(`Invalid data in rows: ${invalidRows.map(r => r.row).join(', ')}`);
            return;
          }

          // Check user limits
          const [roleCountsResponse, clientStatusResponse] = await Promise.all([
            getUserRoleCounts(),
            axios.get('http://147.93.110.150:3001/api/client_status/APPU0009')
          ]);

          if (!roleCountsResponse.success || !clientStatusResponse.data.success) {
            toast.error("Failed to fetch role counts. Please try again.");
            return;
          }

          const roleCounts = roleCountsResponse.data;
          const clientStatus = clientStatusResponse.data.data[0];

          if (roleCounts.user + validRows.length > clientStatus.customers_login) {
            toast.error(`Cannot add ${validRows.length} users. Maximum user limit would be exceeded.`);
            return;
          }

          // Process each row
          let successCount = 0;
          let failCount = 0;

          for (let i = 0; i < validRows.length; i++) {
            try {
              const row = validRows[i];
              const customerId = await generateCustomerId(clientPrefixes.customer_prefix);
              
              // Ensure all fields are properly formatted and no undefined values
              const userData = {
                username: row.username,
                name: row.name,
                phone: row.phone,
                route: row.route,
                city: row.city,
                state: row.state,
                zip_code: row.zip_code,
                customer_id: customerId,
                password: row.username,
                role: 'user',
                // Optional fields with default empty values
                delivery_address: row.delivery_address || '',
                gst_number: row.gst_number || '',
                address_line1: row.address_line1 || '',
                address_line2: row.address_line2 || '',
                address_line3: row.address_line3 || '',
                address_line4: row.address_line4 || ''
              };

              await addUser(userData);
              successCount++;
            } catch (error) {
              console.error(`Failed to add user at row ${i + 2}:`, error);
              failCount++;
            }

            setUploadProgress(Math.round(((i + 1) / validRows.length) * 100));
          }

          // Refresh the user list
          await fetchUsers(searchTerm);
          
          // Show results
          if (successCount > 0) {
            toast.success(`Successfully added ${successCount} users`);
          }
          if (failCount > 0) {
            toast.error(`Failed to add ${failCount} users`);
          }

          // Reset and close modal
          setExcelFile(null);
          setShowBulkUploadModal(false);
        } catch (error) {
          console.error("Error processing Excel file:", error);
          toast.error("Failed to process Excel file");
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
      };

      reader.readAsArrayBuffer(excelFile);
    } catch (error) {
      console.error("Error handling bulk upload:", error);
      toast.error("Failed to process bulk upload");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Add this new function to fetch routes
  const fetchRoutes = async () => {
    try {
      const response = await routeCRUD('read');
      if (response.success) {
        setRoutes(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch routes');
    }
  };

  // Add this new function to handle adding a new route
  const handleAddRoute = async (e) => {
    e.preventDefault();
    try {
      const response = await routeCRUD('create', { name: newRouteName });
      if (response.success) {
        toast.success('Route added successfully');
        setShowAddRouteModal(false);
        setNewRouteName('');
        fetchRoutes();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to add route');
    }
  };

  // Add this to your existing useEffect
  useEffect(() => {
    fetchRoutes();
  }, []);

  // Modify the route input in both add user and edit user forms
  const renderRouteInput = (formData, setFormData, errors) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Route *
      </label>
      <div className="flex gap-2">
        <select
          name="route"
          required
          value={formData.route}
          onChange={(e) => setFormData({ ...formData, route: e.target.value })}
          className={`flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors?.route ? "border-red-500" : ""}`}
        >
          <option value="">Select a route</option>
          {routes.map((route) => (
            <option key={route.id} value={route.name}>
              {route.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowAddRouteModal(true)}
          className="px-2 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {errors?.route && (
        <p className="mt-1 text-sm text-red-600">{errors.route}</p>
      )}
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <SearchBar 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
          placeholder="Search by name, phone, or route"
          className="w-full max-w-md"
        />

        {loggedInUser?.role === "superadmin" && (
          <div className="flex space-x-4">
            <button
              onClick={() => setShowBulkUploadModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
              disabled={isLoading || isCheckingLimits}
            >
              Bulk Upload
            </button>
            <button
              onClick={handleAddSalesManagerClick}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors shadow-sm"
              disabled={isLoading || isCheckingLimits}
            >
              {isLoading || isCheckingLimits ? "Loading..." : "Add Sales Manager"}
            </button>
            <button
              onClick={handleAddUserClick}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
              disabled={isLoading || isCheckingLimits}
            >
              {isLoading || isCheckingLimits ? "Loading..." : "Add New User"}
            </button>
          </div>
        )}
      </div>

      <UserTable
        users={users}
        isLoading={isLoading}
        onToggleBlock={handleToggleBlock}
        onEditUser={loggedInUser?.role === "superadmin" ? handleEditUser : null}
      />

      {/* Edit User Modal */}
      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          editForm={editForm}
          onEditFormChange={setEditForm}
          onClose={() => setSelectedUser(null)}
          onSave={handleUpdateUser}
          errors={formErrors}
          hideRoleField={true}
          renderRouteInput={() => renderRouteInput(editForm, setEditForm, formErrors)}
        />
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 py-2">
              <h3 className="text-xl font-semibold text-gray-900">Add New User</h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  resetNewUserForm();
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    value={newUser.username}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors.username ? "border-red-500" : ""}`}
                  />
                  {formErrors.username && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer ID *
                  </label>
                  <input
                    type="text"
                    name="customer_id"
                    required
                    value={newUser.customer_id}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-sm text-gray-500">Auto-generated field</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={newUser.name}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors.name ? "border-red-500" : ""}`}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={newUser.phone}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors.phone ? "border-red-500" : ""}`}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                  )}
                </div>
                
                {renderRouteInput(newUser, setNewUser, formErrors)}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST Number
                  </label>
                  <input
                    type="text"
                    name="gst_number"
                    value={newUser.gst_number}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address
                  </label>
                  <textarea
                    name="delivery_address"
                    value={newUser.delivery_address}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    name="address_line1"
                    value={newUser.address_line1}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="address_line2"
                    value={newUser.address_line2}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 3
                  </label>
                  <input
                    type="text"
                    name="address_line3"
                    value={newUser.address_line3}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 4
                  </label>
                  <input
                    type="text"
                    name="address_line4"
                    value={newUser.address_line4}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={newUser.city}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors.city ? "border-red-500" : ""}`}
                  />
                  {formErrors.city && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={newUser.state}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors.state ? "border-red-500" : ""}`}
                  />
                  {formErrors.state && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.state}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zip Code *
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    required
                    value={newUser.zip_code}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors.zip_code ? "border-red-500" : ""}`}
                  />
                  {formErrors.zip_code && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.zip_code}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetNewUserForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Adding..." : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Sales Manager Modal */}
      {showAddSalesManagerModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 py-2">
              <h3 className="text-xl font-semibold text-gray-900">Add New Sales Manager</h3>
              <button 
                onClick={() => {
                  setShowAddSalesManagerModal(false);
                  resetNewUserForm();
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    value={newUser.username}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors.username ? "border-red-500" : ""}`}
                  />
                  {formErrors.username && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer ID *
                  </label>
                  <input
                    type="text"
                    name="customer_id"
                    required
                    value={newUser.customer_id}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-sm text-gray-500">Auto-generated field</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={newUser.name}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors.name ? "border-red-500" : ""}`}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={newUser.phone}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors.phone ? "border-red-500" : ""}`}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Route *
                  </label>
                  <input
                    type="text"
                    name="route"
                    required
                    value={newUser.route}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors.route ? "border-red-500" : ""}`}
                  />
                  {formErrors.route && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.route}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST Number
                  </label>
                  <input
                    type="text"
                    name="gst_number"
                    value={newUser.gst_number}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address
                  </label>
                  <textarea
                    name="delivery_address"
                    value={newUser.delivery_address}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    name="address_line1"
                    value={newUser.address_line1}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="address_line2"
                    value={newUser.address_line2}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 3
                  </label>
                  <input
                    type="text"
                    name="address_line3"
                    value={newUser.address_line3}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 4
                  </label>
                  <input
                    type="text"
                    name="address_line4"
                    value={newUser.address_line4}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={newUser.city}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors.city ? "border-red-500" : ""}`}
                  />
                  {formErrors.city && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={newUser.state}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors.state ? "border-red-500" : ""}`}
                  />
                  {formErrors.state && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.state}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zip Code *
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    required
                    value={newUser.zip_code}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors.zip_code ? "border-red-500" : ""}`}
                  />
                  {formErrors.zip_code && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.zip_code}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSalesManagerModal(false);
                    resetNewUserForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Adding..." : "Add Sales Manager"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Bulk Upload Users</h3>
              <button 
                onClick={() => {
                  setShowBulkUploadModal(false);
                  setExcelFile(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Upload an Excel file with the following required columns:
                <br />
                username, name, phone, route, city, state, zip_code
              </p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setExcelFile(e.target.files[0])}
                  className="hidden"
                  id="excel-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="excel-upload"
                  className="cursor-pointer text-indigo-600 hover:text-indigo-700"
                >
                  {excelFile ? excelFile.name : "Click to select Excel file"}
                </label>
              </div>
            </div>

            {isUploading && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowBulkUploadModal(false);
                  setExcelFile(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpload}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50"
                disabled={!excelFile || isUploading}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Route Modal */}
      {showAddRouteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Add New Route</h3>
              <button 
                onClick={() => {
                  setShowAddRouteModal(false);
                  setNewRouteName('');
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddRoute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Route Name
                </label>
                <input
                  type="text"
                  value={newRouteName}
                  onChange={(e) => setNewRouteName(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRouteModal(false);
                    setNewRouteName('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Add Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}