import React, { useState, useEffect } from "react";
import { getSalesmen, addSalesman, updateSalesman ,getUserRoleCounts, uploadSalesmanImage } from "../services/api";
import toast from "react-hot-toast";
import SearchBar from "./SalesmanMaster/SearchBar";
import SalesmanTable from "./SalesmanMaster/SalesmanTable";
import EditSalesmanModal from "./SalesmanMaster/EditSalesmanModal";
import axios from "axios";
import * as XLSX from 'xlsx';
import { Plus, User } from 'lucide-react';
import { routeCRUD } from "../services/api";

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
    address_line1: "",
    phone: "",
    designation: "",
    aadhar_number: "",
    pan_number: "",
    dl_number: "",
    notes: "",
    role: "ADMIN"
  };

  const [editForm, setEditForm] = useState(initialFormState);
  const [newSalesman, setNewSalesman] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

  // Track if limit is reached for disabling button
  const [isSalesmanLimitReached, setIsSalesmanLimitReached] = useState(false);

  // Update limit state whenever salesmen or client status changes
  useEffect(() => {
    async function checkLimit() {
      const [roleCountsResponse, clientStatusResponse] = await Promise.all([
        getUserRoleCounts(),
        axios.get('http://147.93.110.150:3001/api/client_status/APPU0009')
      ]);
      if (roleCountsResponse.success && clientStatusResponse.data.success) {
        const roleCounts = roleCountsResponse.data;
        const clientStatus = clientStatusResponse.data.data[0];
        const currentSalesmanCount = roleCounts.salesman || 0;
        const allowedSalesmanCount = clientStatus.sales_mgr_login || 0;
        setIsSalesmanLimitReached(currentSalesmanCount >= allowedSalesmanCount);
      }
    }
    checkLimit();
  }, [salesmen]);

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
      const allUsers = await getSalesmen();
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
      const data = await getSalesmen(search);
      setSalesmen(data);
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
      address_line1: salesman.address_line1 || "",
      phone: salesman.phone || "",
      designation: salesman.designation || "",
      aadhar_number: salesman.aadhar_number || "",
      pan_number: salesman.pan_number || "",
      dl_number: salesman.dl_number || "",
      notes: salesman.notes || "",
      role: "ADMIN"
    });
  };

  const handleUpdateSalesman = async (customer_id, formData) => {
    try {
      const response = await updateSalesman(customer_id, formData);
      if (response.success) {
        await fetchSalesmenData(searchTerm);
        setSelectedSalesman(null);
        return response;
      }
      throw new Error(response.message || "Failed to update salesman");
    } catch (error) {
      console.error('Error updating salesman:', error);
      throw error;
    }
  };

  const validateForm = (formData) => {
    const errors = {};

    // Only username and customer_id are required
    if (!formData.username) errors.username = "Username is required";
    if (!formData.customer_id) errors.customer_id = "Customer ID is required";

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
        toast.error("Failed to fetch role counts. Please try again.");
        return false;
      }

      const roleCounts = roleCountsResponse.data;
      const clientStatus = clientStatusResponse.data.data[0];

      // Only check admin (salesman) login limit
      const currentAdminCount = roleCounts.admin || 0;
      const allowedAdminCount = clientStatus.sales_mgr_login || 0;

      if (currentAdminCount >= allowedAdminCount) {
        toast.error(`Maximum salesman limit reached (${currentAdminCount}/${allowedAdminCount}). Please upgrade your plan or contact administrator.`);
        return false;
      }

      return true;
    } catch (error) {
      toast.error("Failed to check salesman limits. Please try again.");
      return false;
    } finally {
      setIsCheckingLimits(false);
    }
  };

  const handleAddSalesmanClick = async () => {
    // Check salesman limits before opening modal
    const canAddSalesman = await checkSalesmanLimits();
    if (!canAddSalesman) {
      toast.error('Salesman limit reached. Cannot add more salesmen.');
      return;
    }
    // Always use 'SM' as prefix for salesmen
    const newCustomerId = await generateCustomerId('SM');
    setNewSalesman(prev => ({
      ...prev,
      customer_id: newCustomerId,
      role: 'admin'
    }));
    setShowAddModal(true);
  };

  const handleAddSalesman = async (e) => {
    e.preventDefault();
    // Double check limit before submit
    const canAddSalesman = await checkSalesmanLimits();
    if (!canAddSalesman) {
      toast.error('Salesman limit reached. Cannot add more salesmen.');
      setShowAddModal(false);
      return;
    }
    if (!validateForm(newSalesman)) {
      toast.error('Please fill all required fields.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Submitting new salesman:', newSalesman); // DEBUG
      // First check if we can add more salesmen
      const canAddSalesman = await checkSalesmanLimits();
      if (!canAddSalesman) {
        toast.error('Salesman limit reached.');
        return;
      }

      // Prepare the data for API
      const salesmanData = {
        customer_id: newSalesman.customer_id,
        username: newSalesman.username?.trim() || "",
        name: newSalesman.username?.trim() || "",
        phone: newSalesman.phone?.trim() || null,
        address_line1: newSalesman.address_line1?.trim() || null,
        designation: newSalesman.designation?.trim() || null,
        route: newSalesman.route || null,
        aadhar_number: newSalesman.aadhar_number?.trim() || null,
        pan_number: newSalesman.pan_number?.trim() || null,
        dl_number: newSalesman.dl_number?.trim() || null,
        notes: newSalesman.notes?.trim() || null
      };

      console.log('Sending to API:', salesmanData); // DEBUG
      const response = await addSalesman(salesmanData);
      console.log('Add salesman response:', response); // DEBUG
      let imageUploaded = false;
      let imageFilename = null;
      if (response.success) {
        // If image file is selected, upload it
        if (newSalesman.imageFile) {
          try {
            const uploadResponse = await uploadSalesmanImage(newSalesman.customer_id, newSalesman.imageFile);
            if (uploadResponse.success || uploadResponse.status) {
              imageUploaded = true;
              imageFilename = uploadResponse.data?.filename || uploadResponse.filename;
              // Update the salesman with the image filename
              if (imageFilename) {
                await updateSalesman(newSalesman.customer_id, { image: imageFilename });
              }
            } else {
              toast.error(uploadResponse.message || 'Image upload failed');
            }
          } catch (imgErr) {
            toast.error(imgErr.message || 'Image upload failed');
          }
        }
        await fetchSalesmenData(searchTerm);
        setShowAddModal(false);
        resetNewSalesmanForm();
        toast.success(
          (imageUploaded ? 'Salesman and image added successfully' : response.message || 'Salesman added successfully')
        );
      } else {
        throw new Error(response.message || 'Failed to add salesman');
      }
    } catch (error) {
      console.error('Error adding salesman:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to add salesman');
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

  // Fetch routes
  const fetchRoutes = async () => {
    try {
      // Assuming routeCRUD API is available and works like in UsersTab
      const response = await routeCRUD('read');
      if (response.success) {
        setRoutes(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch routes');
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to fetch routes');
    }
  };

  // Handle adding a new route
  const handleAddRoute = async (e) => {
    e.preventDefault();
    if (!newRouteName.trim()) {
      toast.error('Route name cannot be empty.');
      return;
    }
    try {
      // Assuming routeCRUD API for create is available
      const response = await routeCRUD('create', { name: newRouteName.trim() });
      if (response.success) {
        toast.success('Route added successfully');
        setShowAddRouteModal(false);
        setNewRouteName('');
        fetchRoutes(); // Refresh routes after adding new one
      } else {
        toast.error(response.message || 'Failed to add route');
      }
    } catch (error) {
      console.error('Error adding route:', error);
      toast.error(error.message || 'Failed to add route');
    }
  };

  // Fetch routes on component mount
  useEffect(() => {
    fetchRoutes();
  }, []);

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
            disabled={isLoading || isCheckingLimits || isSalesmanLimitReached}
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
          onClose={() => {
            setSelectedSalesman(null);
            fetchSalesmenData(searchTerm);
          }}
          onSave={handleUpdateSalesman}
          errors={formErrors}
          renderRouteInput={() => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route
              </label>
              <div className="flex gap-2">
                <select
                  name="route"
                  value={editForm.route}
                  onChange={(e) => setEditForm({ ...editForm, route: e.target.value })}
                  className={`flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors?.route ? "border-red-500" : ""}`}
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
              {formErrors?.route && (
                <p className="mt-1 text-sm text-red-600">{formErrors.route}</p>
              )}
            </div>
          )}
          onImageUpdated={() => fetchSalesmenData(searchTerm)}
          routes={routes}
          setShowAddRouteModal={setShowAddRouteModal}
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
              {/* Image Upload Section - Centered at Top */}
              <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
                  {newSalesman.imagePreview ? (
                    <img src={newSalesman.imagePreview} alt="Salesman" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <User className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-center mb-6">
                <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                  <span>Upload Image (optional)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        setNewSalesman(prev => ({
                          ...prev,
                          imageFile: file,
                          imagePreview: URL.createObjectURL(file)
                        }));
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Sales Man Name - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sales Man Name *</label>
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

              {/* Address - Full Width */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address_line1"
                  value={newSalesman.address_line1}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {/* Designation / Salesman Code - Two Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    value={newSalesman.designation}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salesman Code *</label>
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
              </div>

              {/* Mobile No / Aadhar No - Two Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar No</label>
                  <input
                    type="text"
                    name="aadhar_number"
                    value={newSalesman.aadhar_number}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* PAN No / DL No - Two Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN No</label>
                  <input
                    type="text"
                    name="pan_number"
                    value={newSalesman.pan_number}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DL No</label>
                  <input
                    type="text"
                    name="dl_number"
                    value={newSalesman.dl_number}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Route Input - Full Width */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Route *</label>
                <div className="flex gap-2">
                  <select
                    name="route"
                    required
                    value={newSalesman.route}
                    onChange={handleInputChange}
                    className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors.route ? "border-red-500" : ""}`}
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
                {formErrors.route && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.route}</p>
                )}
              </div>

              {/* Notes - Full Width */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={newSalesman.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
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