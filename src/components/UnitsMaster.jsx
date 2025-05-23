import React, { useState, useEffect } from 'react';
import { createUOM, getUOMs, updateUOM, deleteUOM } from '../services/api';
import { Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UnitsMaster() {
  const [units, setUnits] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUnit, setCurrentUnit] = useState({ id: '', name: '' });
  const [newUnit, setNewUnit] = useState({ name: '' });

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const response = await getUOMs();
      if (response.success) {
        setUnits(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch units of measure');
      }
    } catch (error) {
      toast.error('Failed to fetch units of measure');
    }
  };

  const handleAddUnit = async (e) => {
    e.preventDefault();
    try {
      const response = await createUOM(newUnit.name);
      if (response.success) {
        await fetchUnits();
        setShowAddModal(false);
        setNewUnit({ name: '' });
        toast.success(response.message || 'Unit of measure added successfully');
      } else {
        toast.error(response.message || 'Failed to add unit of measure');
      }
    } catch (error) {
      toast.error('Failed to add unit of measure');
    }
  };

  const handleEditUnit = async (e) => {
    e.preventDefault();
    try {
      const response = await updateUOM(currentUnit.id, currentUnit.name);
      if (response.success) {
        await fetchUnits();
        setShowEditModal(false);
        toast.success(response.message || 'Unit of measure updated successfully');
      } else {
        toast.error(response.message || 'Failed to update unit of measure');
      }
    } catch (error) {
      toast.error('Failed to update unit of measure');
    }
  };

  const handleDeleteUnit = async (unitId) => {
    if (window.confirm('Are you sure you want to delete this unit of measure?')) {
      try {
        const response = await deleteUOM(unitId);
        if (response.success) {
          await fetchUnits();
          toast.success(response.message || 'Unit of measure deleted successfully');
        } else {
          toast.error(response.message || 'Failed to delete unit of measure');
        }
      } catch (error) {
        toast.error('Failed to delete unit of measure');
      }
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-[#003366]">Units of Measure Master</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Unit
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {units.map((unit) => (
                <tr key={unit.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {unit.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setCurrentUnit(unit);
                        setShowEditModal(true);
                      }}
                      className="text-[#003366] hover:text-[#002244] mr-4"
                    >
                      <Edit className="h-5 w-5 inline" />
                    </button>
                    <button
                      onClick={() => handleDeleteUnit(unit.id)}
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

        {/* Add Unit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-[#003366] mb-6">
                Add New Unit of Measure
              </h3>
              <form onSubmit={handleAddUnit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Name
                  </label>
                  <input
                    type="text"
                    value={newUnit.name}
                    onChange={(e) => setNewUnit({ name: e.target.value })}
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
                    Add Unit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Unit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-[#003366] mb-6">
                Edit Unit of Measure
              </h3>
              <form onSubmit={handleEditUnit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Name
                  </label>
                  <input
                    type="text"
                    value={currentUnit.name}
                    onChange={(e) =>
                      setCurrentUnit({ ...currentUnit, name: e.target.value })
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
                    Update Unit
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