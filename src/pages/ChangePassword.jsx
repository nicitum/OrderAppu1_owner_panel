import React, { useState } from 'react';
import { changePassword } from '../services/api';
import { toast } from 'react-toastify';
import logo from '/assets/logo.jpg';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long!');
      return;
    }

    try {
      setLoading(true);
      console.log('Calling changePassword API with new password:', formData.newPassword);
      const response = await changePassword(formData.newPassword);
      console.log('API Response:', response);
      
      if (response.status) {
        // Log the success response
        console.log('Password change successful:', response);
        
        // Show success message
        toast.success(response.message || 'Password changed successfully!');
        
        // Clear the form
        setFormData({
          newPassword: '',
          confirmPassword: '',
        });

        // Wait a moment before logging out to ensure the message is seen
        setTimeout(() => {
          // Clear all auth data
          localStorage.removeItem('authToken');
          localStorage.removeItem('loggedInUser');
          sessionStorage.clear();
          
          // Force reload to clear any cached data
          window.location.href = '/login';
        }, 1500);
      } else {
        console.error('Password change failed:', response);
        toast.error(response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Logo */}
        <img 
          src={logo}
          alt="Order Appu Admin Panel Logo" 
          className="w-20 h-20 mx-auto mb-6 object-contain"
        />

        {/* Header */}
        <h2 className="text-3xl font-semibold text-center text-[#003366] mb-8">
          Change Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366]"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#003366] hover:bg-[#004080] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003366] ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword; 