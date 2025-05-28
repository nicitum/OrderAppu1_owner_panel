import React, { useState, useEffect } from 'react';
import { X, User, Plus } from 'lucide-react';
import { uploadSalesmanImage } from '../../services/api';
import { toast } from 'react-hot-toast';

const API_BASE_URL = "http://147.93.110.150:8091";

// Helper function to get image URL
const getSalesmanImageUrl = (filename) => {
  if (!filename) return null;
  return `${API_BASE_URL}/images/salesman/${filename}`;
};

// Helper function to fetch image as blob
const fetchSalesmanImage = async (filename) => {
  try {
    const response = await fetch(getSalesmanImageUrl(filename));
    if (!response.ok) throw new Error('Failed to fetch image');
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
};

const EditSalesmanModal = ({ salesman, onClose, onSave, onImageUpdated, routes, setShowAddRouteModal }) => {
  const [formData, setFormData] = useState({
    username: '',
    customer_id: '',
    phone: '',
    address_line1: '',
    designation: '',
    route: '',
    aadhar_number: '',
    pan_number: '',
    dl_number: '',
    notes: '',
    image: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (salesman) {
      setFormData({
        username: salesman.username || '',
        customer_id: salesman.customer_id || '',
        phone: salesman.phone || '',
        address_line1: salesman.address_line1 || '',
        designation: salesman.designation || '',
        route: salesman.route || '',
        aadhar_number: salesman.aadhar_number || '',
        pan_number: salesman.pan_number || '',
        dl_number: salesman.dl_number || '',
        notes: salesman.notes || '',
        image: salesman.image || ''
      });

      if (salesman.image) {
        const loadImage = async () => {
          try {
            const url = getSalesmanImageUrl(salesman.image);
            const img = new Image();
            
            try {
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = url;
              });
              setImagePreview(url);
            } catch (err) {
              const blobUrl = await fetchSalesmanImage(salesman.image);
              if (blobUrl) {
                setImagePreview(blobUrl);
              }
            }
          } catch (error) {
            console.error('Image load failed:', error);
            setImagePreview(null);
          }
        };
        
        loadImage();
      }
    }
  }, [salesman]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setImageFile(file);
    } catch (error) {
      console.error('Error handling image:', error);
      toast.error('Failed to handle image upload');
      setImagePreview(null);
      setImageFile(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);

      // Prepare update data
      const updateData = {};
      const fields = [
        'username', 'phone', 'address_line1', 'designation', 'route',
        'aadhar_number', 'pan_number', 'dl_number', 'notes'
      ];

      fields.forEach(field => {
        const newValue = formData[field]?.trim() || null;
        const oldValue = salesman[field]?.trim() || null;
        if (newValue !== oldValue) {
          updateData[field] = newValue;
        }
      });

      // Handle image upload
      if (imageFile) {
        try {
          const response = await uploadSalesmanImage(formData.customer_id, imageFile);
          if (!(response.success || response.status)) {
            throw new Error(response.message || 'Failed to upload image');
          }
          // Use the new filename for update and preview
          const newFilename = response.data?.filename || response.filename;
          if (newFilename) {
            updateData.image = newFilename;
            setImagePreview(getSalesmanImageUrl(newFilename) + '?t=' + Date.now());
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error(error.response?.data?.message || error.message || 'Failed to upload image');
          throw error;
        }
      } else if (imagePreview === null && salesman.image) {
        // If image was cleared
        updateData.image = null;
      }

      // Only send update if there are changes
      if (Object.keys(updateData).length === 0) {
        toast.error("No changes to save");
        return;
      }

      const result = await onSave(formData.customer_id, updateData);
      if (result.success || result.status) {
        toast.success("Salesman updated successfully");
        onClose();
        if (typeof onImageUpdated === 'function') onImageUpdated();
      } else {
        throw new Error(result?.message || "Failed to update salesman");
      }
    } catch (error) {
      console.error('Error updating salesman:', error);
      toast.error(error.message || "Failed to update salesman");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup image preview URLs
  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Edit Salesman</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Image Upload Section - Centered at Top */}
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
              {imagePreview ? (
                <img src={imagePreview} alt="Salesman" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-center mb-6">
            <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
              <span>Change Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={isSubmitting}
              />
            </label>
          </div>

          {/* Sales Man Name - Full Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sales Man Name *</label>
            <input
              type="text"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Address - Full Width */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.address_line1}
              onChange={e => setFormData({ ...formData, address_line1: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          {/* Designation / Salesman Code - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={e => setFormData({ ...formData, designation: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salesman Code *</label>
              <input
                type="text"
                value={formData.customer_id}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50"
              />
            </div>
          </div>

          {/* Mobile No / Aadhar No - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar No</label>
              <input
                type="text"
                value={formData.aadhar_number}
                onChange={e => setFormData({ ...formData, aadhar_number: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* PAN No / DL No - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN No</label>
              <input
                type="text"
                value={formData.pan_number}
                onChange={e => setFormData({ ...formData, pan_number: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DL No</label>
              <input
                type="text"
                value={formData.dl_number}
                onChange={e => setFormData({ ...formData, dl_number: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                value={formData.route}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
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
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSalesmanModal;