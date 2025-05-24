import React, { useState, useEffect } from 'react';
import { createStockGroup, getStockGroups, updateStockGroup, deleteStockGroup } from '../services/api';
import { Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StockGroupsMaster() {
  const [stockGroups, setStockGroups] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentStockGroup, setCurrentStockGroup] = useState({ id: '', name: '' });
  const [newStockGroup, setNewStockGroup] = useState({ name: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStockGroups();
  }, []);

  const fetchStockGroups = async () => {
    try {
      setLoading(true);
      console.log('Fetching stock groups...');
      const response = await getStockGroups();
      console.log('Stock groups API response:', response);
      
      if (response && response.data) {
        setStockGroups(response.data);
      } else {
        console.error('Invalid response format:', response);
        toast.error('Failed to fetch stock groups: Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching stock groups:', error);
      toast.error(error.message || 'Failed to fetch stock groups');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStockGroup = async (e) => {
    e.preventDefault();
    if (!newStockGroup.name.trim()) {
      toast.error('Stock group name is required');
      return;
    }

    try {
      setLoading(true);
      const response = await createStockGroup(newStockGroup.name.trim());
      if (response.success) {
        await fetchStockGroups();
        setShowAddModal(false);
        setNewStockGroup({ name: '' });
        toast.success(response.message || 'Stock group added successfully');
      } else {
        toast.error(response.message || 'Failed to add stock group');
      }
    } catch (error) {
      console.error('Error adding stock group:', error);
      toast.error(error.message || 'Failed to add stock group');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStockGroup = async (e) => {
    e.preventDefault();
    if (!currentStockGroup.name.trim()) {
      toast.error('Stock group name is required');
      return;
    }

    try {
      setLoading(true);
      const response = await updateStockGroup(currentStockGroup.id, currentStockGroup.name.trim());
      if (response.success) {
        await fetchStockGroups();
        setShowEditModal(false);
        toast.success(response.message || 'Stock group updated successfully');
      } else {
        toast.error(response.message || 'Failed to update stock group');
      }
    } catch (error) {
      console.error('Error updating stock group:', error);
      toast.error(error.message || 'Failed to update stock group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStockGroup = async (stockGroupId) => {
    if (window.confirm('Are you sure you want to delete this stock group?')) {
      try {
        setLoading(true);
        const response = await deleteStockGroup(stockGroupId);
        if (response.success) {
          await fetchStockGroups();
          toast.success(response.message || 'Stock group deleted successfully');
        } else {
          toast.error(response.message || 'Failed to delete stock group');
        }
      } catch (error) {
        console.error('Error deleting stock group:', error);
        toast.error(error.message || 'Failed to delete stock group');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-[#003366]">Stock Groups Master</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
            disabled={loading}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Stock Group
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Group Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="2" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : stockGroups.length === 0 ? (
                <tr>
                  <td colSpan="2" className="px-6 py-4 text-center text-gray-500">
                    No stock groups found
                  </td>
                </tr>
              ) : (
                stockGroups.map((stockGroup) => (
                  <tr key={stockGroup.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stockGroup.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setCurrentStockGroup(stockGroup);
                          setShowEditModal(true);
                        }}
                        className="text-[#003366] hover:text-[#002244] mr-4"
                        disabled={loading}
                      >
                        <Edit className="h-5 w-5 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteStockGroup(stockGroup.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={loading}
                      >
                        <Trash2 className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Stock Group Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-[#003366] mb-6">
                Add New Stock Group
              </h3>
              <form onSubmit={handleAddStockGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Group Name *
                  </label>
                  <input
                    type="text"
                    value={newStockGroup.name}
                    onChange={(e) => setNewStockGroup({ name: e.target.value })}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#003366] hover:bg-[#002244] rounded-lg transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Stock Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Stock Group Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-[#003366] mb-6">
                Edit Stock Group
              </h3>
              <form onSubmit={handleEditStockGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Group Name *
                  </label>
                  <input
                    type="text"
                    value={currentStockGroup.name}
                    onChange={(e) =>
                      setCurrentStockGroup({ ...currentStockGroup, name: e.target.value })
                    }
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#003366] hover:bg-[#002244] rounded-lg transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Stock Group'}
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