import React, { useEffect, useState } from "react";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

export default function EditUserModal({
  user,
  editForm,
  onEditFormChange,
  onClose,
  onSave,
  errors,
  hideRoleField,
  renderRouteInput
}) {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser")); // Get logged-in user info
  const [indianStates, setIndianStates] = useState([]);

  useEffect(() => {
    fetch("/indian_states.txt")
      .then((res) => res.text())
      .then((text) => {
        setIndianStates(text.trim().split("\n").filter(Boolean));
      });
  }, []);

  if (!user) return null;

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onEditFormChange({ ...editForm, [name]: value });
  };

  // Handle status toggle
  const handleStatusToggle = () => {
    const newStatus = editForm.status === "Active" ? "Block" : "Active";
    onEditFormChange({ ...editForm, status: newStatus });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission
    onSave(e);
  };

  // Handle role change for superadmins
  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    onEditFormChange({ ...editForm, role: selectedRole });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 py-2 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Edit User</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-light"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Business Name (username) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
              <input
                type="text"
                name="username"
                required
                value={editForm.username}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.username ? "border-red-500" : ""}`}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alias */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alias</label>
              <input
                type="text"
                name="alias"
                value={editForm.alias}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Optional alias name"
              />
            </div>
            {/* Customer Code (customer_id) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Code *</label>
              <input
                type="text"
                name="customer_id"
                required
                value={editForm.customer_id}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-gray-500">Auto-generated field</p>
            </div>
            {/* Customer Name (name) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                name="name"
                required
                value={editForm.name}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.name ? "border-red-500" : ""}`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                required
                value={editForm.email}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            {/* Mobile Number (phone) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                name="phone"
                required
                value={editForm.phone}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.phone ? "border-red-500" : ""}`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                name="city"
                required
                value={editForm.city}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.city ? "border-red-500" : ""}`}
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city}</p>
              )}
            </div>
            {/* Address Line 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
              <input
                type="text"
                name="address_line1"
                value={editForm.address_line1}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            {/* Country (fixed) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                name="country"
                value="India"
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            {/* Address Line 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
              <input
                type="text"
                name="address_line2"
                value={editForm.address_line2}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            {/* State (dropdown) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <select
                name="state"
                required
                value={editForm.state}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.state ? "border-red-500" : ""}`}
              >
                <option value="">Select a state</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              {errors.state && (
                <p className="mt-1 text-sm text-red-600">{errors.state}</p>
              )}
            </div>
            {/* Address Line 3 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 3</label>
              <input
                type="text"
                name="address_line3"
                value={editForm.address_line3}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            {/* Pin Code (zip_code) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pin Code *</label>
              <input
                type="text"
                name="zip_code"
                required
                value={editForm.zip_code}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.zip_code ? "border-red-500" : ""}`}
              />
              {errors.zip_code && (
                <p className="mt-1 text-sm text-red-600">{errors.zip_code}</p>
              )}
            </div>
            {/* Address Line 4 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 4</label>
              <input
                type="text"
                name="address_line4"
                value={editForm.address_line4}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            {/* GST Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
              <input
                type="text"
                name="gst_number"
                value={editForm.gst_number}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            {/* Delivery Address (full width, more space) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
              <textarea
                name="delivery_address"
                value={editForm.delivery_address}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}