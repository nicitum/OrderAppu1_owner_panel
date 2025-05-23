import React, { useState, useEffect } from 'react';
import { createCategory, getCategories, updateCategory, deleteCategory } from '../services/api';
import { Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CategoriesMaster() {
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({ id: '', name: '' });
  const [newCategory, setNewCategory] = useState({ name: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      if (response.success) {
        setCategories(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch categories');
      }
    } catch (error) {
      toast.error('Failed to fetch categories');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await createCategory(newCategory.name);
      if (response.success) {
        await fetchCategories();
        setShowAddModal(false);
        setNewCategory({ name: '' });
        toast.success(response.message || 'Category added successfully');
      } else {
        toast.error(response.message || 'Failed to add category');
      }
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await updateCategory(currentCategory.id, currentCategory.name);
      if (response.success) {
        await fetchCategories();
        setShowEditModal(false);
        toast.success(response.message || 'Category updated successfully');
      } else {
        toast.error(response.message || 'Failed to update category');
      }
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const response = await deleteCategory(categoryId);
        if (response.success) {
          await fetchCategories();
          toast.success(response.message || 'Category deleted successfully');
        } else {
          toast.error(response.message || 'Failed to delete category');
        }
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-[#003366]">Category Master</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Category
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setCurrentCategory(category);
                        setShowEditModal(true);
                      }}
                      className="text-[#003366] hover:text-[#002244] mr-4"
                    >
                      <Edit className="h-5 w-5 inline" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
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

        {/* Add Category Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-[#003366] mb-6">
                Add New Category
              </h3>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ name: e.target.value })}
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
                    Add Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Category Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-[#003366] mb-6">
                Edit Category
              </h3>
              <form onSubmit={handleEditCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={currentCategory.name}
                    onChange={(e) =>
                      setCurrentCategory({ ...currentCategory, name: e.target.value })
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
                    Update Category
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