import React, { useState, useEffect } from "react";
import {
  getSalesmen,
  toggleSalesmanBlock,
  updateSalesman,
  addSalesman,
  getAssignedSalesmen,
  getUserRoleCounts,
  routeCRUD,
  fetchSalesmen,
} from "../services/api";
import toast from "react-hot-toast";
import SearchBar from "./SalesmanMaster/SearchBar";
import SalesmanTable from "./SalesmanMaster/SalesmanTable";
import EditSalesmanModal from "./SalesmanMaster/EditSalesmanModal";
import axios from "axios";
import * as XLSX from 'xlsx';
import { Plus } from 'lucide-react';

export default function SalesmanMaster() {
  const [salesmen, setSalesmen] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSalesman, setSelectedSalesman] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCheckingLimits, setIsCheckingLimits] = useState(false);
  const [clientPrefixes, setClientPrefixes] = useState({
    customer_prefix: "",
    sm_prefix: "",
    superadmin_prefix: ""
  });
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
    email: "",
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
    role: "salesman",
  };

  const [editForm, setEditForm] = useState(initialFormState);
  const [newSalesman, setNewSalesman] = useState(initialFormState);
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
      const allUsers = await fetchSalesmen();
      console.log("All users:", allUsers); // Debug log
      
      const prefixUsers = allUsers.filter(user => 
        user.customer_id && user.customer_id.startsWith(prefix)
      );
      console.log("Prefix users:", prefixUsers); // Debug log
      
      const numbers = prefixUsers.map(user => {
        // Extract the number part after the prefix
        const numStr = user.customer_id.substring(prefix.length);
        const num = parseInt(numStr);
        console.log(`Parsing ${user.customer_id} -> ${numStr} -> ${num}`); // Debug log
        return isNaN(num) ? 0 : num;
      });
      
      console.log("Extracted numbers:", numbers); // Debug log
      const maxNumber = Math.max(0, ...numbers);
      console.log("Max number found:", maxNumber); // Debug log
      
      const nextNumber = maxNumber + 1;
      console.log("Next number will be:", nextNumber); // Debug log
      
      // Format with leading zeros to maintain 4 digits
      const newId = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
      console.log("Generated new ID:", newId); // Debug log
      
      return newId;
    } catch (error) {
      console.error("Error generating customer ID:", error);
      toast.error("Failed to generate customer ID");
      return `${prefix}0001`; // Default to 0001 if error occurs
    }
  };

  // Update the fetchSalesmen function
  const fetchSalesmenData = async (search) => {
    setIsLoading(true);
    try {
      if (loggedInUser?.role === "superadmin") {
        const data = await fetchSalesmen();
        // Filter based on search term if provided
        const filteredData = search
          ? data.filter(salesman => 
              salesman.name?.toLowerCase().includes(search.toLowerCase()) ||
              salesman.phone?.includes(search) ||
              salesman.route?.toLowerCase().includes(search.toLowerCase())
            )
          : data;
        setSalesmen(filteredData);
      } else if (loggedInUser?.role === "admin") {
        const result = await getAssignedSalesmen(loggedInUser.id1);
        if (result.success) {
          setSalesmen(result.assignedUsers);
        } else {
          setSalesmen([]);
          toast.error(result.message || "Failed to fetch assigned salesmen");
        }
      }
    } catch (error) {
      toast.error("Failed to fetch salesmen");
      console.error("Error fetching salesmen:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the useEffect for search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSalesmenData(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Add initial data fetch
  useEffect(() => {
    fetchSalesmenData();
  }, []);

  const handleToggleBlock = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === "Block" ? "Active" : "Block";
      await toggleSalesmanBlock(userId, newStatus);
      fetchSalesmenData(searchTerm);
      toast.success(
        `Salesman ${newStatus === "Block" ? "blocked" : "activated"} successfully`
      );
    } catch (error) {
      toast.error("Failed to update salesman status");
    }
  };

  const handleEditSalesman = (salesman) => {
    setSelectedSalesman(salesman);
    setEditForm({
      username: salesman.username || "",
      customer_id: salesman.customer_id || "",
      phone: salesman.phone || "",
      password: "",
      name: salesman.name || "",
      email: salesman.email || "",
      route: salesman.route || "",
      delivery_address: salesman.delivery_address || "",
      gst_number: salesman.gst_number || "",
      address_line1: salesman.address_line1 || "",
      address_line2: salesman.address_line2 || "",
      address_line3: salesman.address_line3 || "",
      address_line4: salesman.address_line4 || "",
      city: salesman.city || "",
      state: salesman.state || "",
      zip_code: salesman.zip_code || "",
      role: "salesman",
    });
  };

  const handleUpdateSalesman = async (e) => {
    e.preventDefault();
    
    if (!validateForm(editForm)) return;
    
    try {
      const updateData = {
        ...editForm,
        role: 'admin'
      };
      await updateSalesman(selectedSalesman.customer_id, updateData);
      fetchSalesmenData(searchTerm);
      setSelectedSalesman(null);
      toast.success("Salesman updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update salesman");
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
    if (!formData.email) errors.email = "Email is required";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkSalesmanLimits = async () => {
    try {
      setIsCheckingLimits(true);
      const [roleCountsResponse, clientStatusResponse] = await Promise.all([
        getUserRoleCounts(),
        axios.get('http://147.93.110.150:3001/api/client_status/APPU0009')
      ]);

      if (!roleCountsResponse.success || !clientStatusResponse.data.success) {
        console.error("Role counts response:", roleCountsResponse);
        console.error("Client status response:", clientStatusResponse);
        toast.error("Failed to fetch role counts. Please try again.");
        return false;
      }

      const roleCounts = roleCountsResponse.data;
      const clientStatus = clientStatusResponse.data.data[0];

      console.log("Role counts:", roleCounts);
      console.log("Client status:", clientStatus);

      const currentSalesmanCount = roleCounts.salesman || 0;
      const allowedSalesmanCount = clientStatus.sales_mgr_login || 0;

      console.log("Current salesman count:", currentSalesmanCount);
      console.log("Allowed salesman count:", allowedSalesmanCount);

      if (currentSalesmanCount >= allowedSalesmanCount) {
        toast.error(`Maximum salesman limit reached (${currentSalesmanCount}/${allowedSalesmanCount}). Please upgrade your plan or contact administrator.`);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking salesman limits:", error);
      toast.error("Failed to check salesman limits. Please try again.");
      return false;
    } finally {
      setIsCheckingLimits(false);
    }
  };

  const handleAddSalesmanClick = async () => {
    const canAddSalesman = await checkSalesmanLimits();
    if (canAddSalesman) {
      // Always use 'SM' as prefix for salesmen
      const newCustomerId = await generateCustomerId('SM');
      console.log("Generated new customer ID:", newCustomerId); // Debug log
      setNewSalesman(prev => ({
        ...prev,
        customer_id: newCustomerId,
        role: 'admin'
      }));
      setShowAddModal(true);
    }
  };

  const handleAddSalesman = async (e) => {
    e.preventDefault();
    
    if (!validateForm(newSalesman)) return;
    
    try {
      setIsLoading(true);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newSalesman.email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      const [roleCountsResponse, clientStatusResponse] = await Promise.all([
        getUserRoleCounts(),
        axios.get('http://147.93.110.150:3001/api/client_status/APPU0009')
      ]);

      if (!roleCountsResponse.success || !clientStatusResponse.data.success) {
        console.error("Role counts response:", roleCountsResponse);
        console.error("Client status response:", clientStatusResponse);
        toast.error("Failed to fetch role counts. Please try again.");
        return;
      }

      const roleCounts = roleCountsResponse.data;
      const clientStatus = clientStatusResponse.data.data[0];

      console.log("Role counts:", roleCounts);
      console.log("Client status:", clientStatus);

      const currentSalesmanCount = roleCounts.salesman || 0;
      const allowedSalesmanCount = clientStatus.sales_mgr_login || 0;

      console.log("Current salesman count:", currentSalesmanCount);
      console.log("Allowed salesman count:", allowedSalesmanCount);

      if (currentSalesmanCount >= allowedSalesmanCount) {
        toast.error(`Maximum salesman limit reached (${currentSalesmanCount}/${allowedSalesmanCount}). Please upgrade your plan or contact administrator.`);
        return;
      }

      const salesmanData = {
        ...newSalesman,
        phone: String(newSalesman.phone).trim(),
        password: newSalesman.username,
        email: newSalesman.email.trim(),
        role: 'admin'
      };
      
      console.log("Sending salesman data:", salesmanData);
      const response = await addSalesman(salesmanData);
      console.log("Add salesman response:", response);
      
      if (response.status === true) {
        await fetchSalesmenData(searchTerm);
        setShowAddModal(false);
        resetNewSalesmanForm();
        toast.success(response.message || "Salesman added successfully");
      } else {
        throw new Error(response.message || 'Failed to add salesman');
      }
    } catch (error) {
      console.error("Add salesman error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to add salesman. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetNewSalesmanForm = () => {
    setNewSalesman(initialFormState);
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSalesman(prev => ({
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

  useEffect(() => {
    fetchRoutes();
  }, []);

  // Modify the route input in both add salesman and edit salesman forms
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
          <button
            onClick={handleAddSalesmanClick}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
            disabled={isLoading || isCheckingLimits}
          >
            {isLoading || isCheckingLimits ? "Loading..." : "Add New Salesman"}
          </button>
        )}
      </div>

      <SalesmanTable
        salesmen={salesmen}
        isLoading={isLoading}
        onToggleBlock={handleToggleBlock}
        onEditSalesman={loggedInUser?.role === "superadmin" ? handleEditSalesman : null}
      />

      {/* Edit Salesman Modal */}
      {selectedSalesman && (
        <EditSalesmanModal
          salesman={selectedSalesman}
          editForm={editForm}
          onEditFormChange={setEditForm}
          onClose={() => setSelectedSalesman(null)}
          onSave={handleUpdateSalesman}
          errors={formErrors}
          renderRouteInput={() => renderRouteInput(editForm, setEditForm, formErrors)}
        />
      )}

      {/* Add Salesman Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 py-2">
              <h3 className="text-xl font-semibold text-gray-900">Add New Salesman</h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  resetNewSalesmanForm();
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddSalesman} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    value={newSalesman.username}
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
                    value={newSalesman.customer_id}
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
                    value={newSalesman.name}
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
                    value={newSalesman.phone}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors.phone ? "border-red-500" : ""}`}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={newSalesman.email}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors.email ? "border-red-500" : ""}`}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>
                
                {renderRouteInput(newSalesman, setNewSalesman, formErrors)}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST Number
                  </label>
                  <input
                    type="text"
                    name="gst_number"
                    value={newSalesman.gst_number}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    name="delivery_address"
                    value={newSalesman.delivery_address}
                    onChange={handleInputChange}
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
                    value={newSalesman.address_line1}
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
                    value={newSalesman.address_line2}
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
                    value={newSalesman.address_line3}
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
                    value={newSalesman.address_line4}
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
                    value={newSalesman.city}
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
                    value={newSalesman.state}
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
                    value={newSalesman.zip_code}
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
                    resetNewSalesmanForm();
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
                  {isLoading ? "Adding..." : "Add Salesman"}
                </button>
              </div>
            </form>
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