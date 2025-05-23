import React, { useState, useEffect } from 'react';
import { createBrand, getBrands, updateBrand, deleteBrand } from '../services/api';
import { Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BrandsMaster() {
  const [brands, setBrands] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentBrand, setCurrentBrand] = useState({ id: '', name: '' });
  const [newBrand, setNewBrand] = useState({ name: '' });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await getBrands();
      if (response.success) {
        setBrands(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch brands');
      }
    } catch (error) {
      toast.error('Failed to fetch brands');
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    try {
      const response = await createBrand(newBrand.name);
      if (response.success) {
        await fetchBrands();
        setShowAddModal(false);
        setNewBrand({ name: '' });
        toast.success(response.message || 'Brand added successfully');
      } else {
        toast.error(response.message || 'Failed to add brand');
      }
    } catch (error) {
      toast.error('Failed to add brand');
    }
  };

  const handleEditBrand = async (e) => {
    e.preventDefault();
    try {
      const response = await updateBrand(currentBrand.id, currentBrand.name);
      if (response.success) {
        await fetchBrands();
        setShowEditModal(false);
        toast.success(response.message || 'Brand updated successfully');
      } else {
        toast.error(response.message || 'Failed to update brand');
      }
    } catch (error) {
      toast.error('Failed to update brand');
    }
  };

  const handleDeleteBrand = async (brandId) => {
    if (window.confirm('Are you sure you want to delete this brand?')) {
      try {
        const response = await deleteBrand(brandId);
        if (response.success) {
          await fetchBrands();
          toast.success(response.message || 'Brand deleted successfully');
        } else {
          toast.error(response.message || 'Failed to delete brand');
        }
      } catch (error) {
        toast.error('Failed to delete brand');
      }
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-[#003366]">Brand Master</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Brand
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {brands.map((brand) => (
                <tr key={brand.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {brand.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setCurrentBrand(brand);
                        setShowEditModal(true);
                      }}
                      className="text-[#003366] hover:text-[#002244] mr-4"
                    >
                      <Edit className="h-5 w-5 inline" />
                    </button>
                    <button
                      onClick={() => handleDeleteBrand(brand.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Brand Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-[#003366] mb-6">
                Add New Brand
              </h3>
              <form onSubmit={handleAddBrand} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={newBrand.name}
                    onChange={(e) => setNewBrand({ name: e.target.value })}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#003366] hover:bg-[#002244] rounded-lg transition-colors"
                  >
                    Add Brand
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Brand Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-[#003366] mb-6">
                Edit Brand
              </h3>
              <form onSubmit={handleEditBrand} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={currentBrand.name}
                    onChange={(e) =>
                      setCurrentBrand({ ...currentBrand, name: e.target.value })
                    }
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#003366] hover:bg-[#002244] rounded-lg transition-colors"
                  >
                    Update Brand
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 