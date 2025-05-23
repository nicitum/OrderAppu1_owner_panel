import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { routeCRUD } from '../services/api';
import toast from 'react-hot-toast';

export default function RouteMaster() {
  const [routes, setRoutes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentRoute, setCurrentRoute] = useState({ id: '', name: '' });
  const [newRoute, setNewRoute] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch all routes
  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await routeCRUD('read');
      if (response.success) {
        setRoutes(response.data);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  // Handle add route
  const handleAddRoute = async (e) => {
    e.preventDefault();
    try {
      const response = await routeCRUD('create', { name: newRoute });
      if (response.success) {
        toast.success('Route added successfully');
        setShowAddModal(false);
        setNewRoute('');
        fetchRoutes();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to add route');
    }
  };

  // Handle edit route
  const handleEditRoute = async (e) => {
    e.preventDefault();
    try {
      const response = await routeCRUD('update', {
        id: currentRoute.id,
        name: currentRoute.name
      });
      if (response.success) {
        toast.success('Route updated successfully');
        setShowEditModal(false);
        fetchRoutes();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update route');
    }
  };

  // Handle delete route
  const handleDeleteRoute = async (id) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        const response = await routeCRUD('delete', { id });
        if (response.success) {
          toast.success('Route deleted successfully');
          fetchRoutes();
        }
      } catch (error) {
        toast.error(error.message || 'Failed to delete route');
      }
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-[#003366]">
            Route Management
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Route
          </button>
        </div>

        {/* Routes Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route Name
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
                    Loading routes...
                  </td>
                </tr>
              ) : routes.length === 0 ? (
                <tr>
                  <td colSpan="2" className="px-6 py-4 text-center text-gray-500">
                    No routes found
                  </td>
                </tr>
              ) : (
                routes.map((route) => (
                  <tr key={route.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {route.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setCurrentRoute(route);
                          setShowEditModal(true);
                        }}
                        className="text-[#003366] hover:text-[#002244] mr-4"
                      >
                        <Edit className="h-5 w-5 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoute(route.id)}
                        className="text-red-600 hover:text-red-900"
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

        {/* Add Route Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-[#003366] mb-4">Add New Route</h3>
              <form onSubmit={handleAddRoute} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Route Name
                  </label>
                  <input
                    type="text"
                    value={newRoute}
                    onChange={(e) => setNewRoute(e.target.value)}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewRoute('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#003366] hover:bg-[#002244] rounded-lg transition-colors"
                  >
                    Add Route
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Route Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-[#003366] mb-4">Edit Route</h3>
              <form onSubmit={handleEditRoute} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Route Name
                  </label>
                  <input
                    type="text"
                    value={currentRoute.name}
                    onChange={(e) => setCurrentRoute({ ...currentRoute, name: e.target.value })}
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
                    Update Route
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