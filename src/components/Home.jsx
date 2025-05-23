import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BarChart3, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Home() {
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClientStatus = async () => {
      try {
        const response = await axios.get('http://147.93.110.150:3001/api/client_status/APPU0009');
        if (response.data.success) {
          setClientData(response.data.data[0]);
          console.log(response.data.data[0]);
        }

      } catch (error) {
        toast.error('Failed to fetch client status');
        console.error('Error fetching client status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientStatus();
  }, []);

  const handleUsersClick = () => {
    navigate('/dashboard/users');
  };

  const handleProductsClick = () => {
    navigate('/dashboard/products');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Order Appu Admin</h1>
        <p className="text-gray-600 mt-2">Client Status Overview</p>
      </div>

      {/* Status Alert */}
      {clientData?.status === "Banned" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">Your account is currently banned. Please contact support.</span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Client Information Card */}
        <div className="col-span-full lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Client Name</p>
              <p className="font-medium">{clientData?.client_name}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">License Number</p>
              <p className="font-medium">{clientData?.license_no}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Plan</p>
              <p className="font-medium">{clientData?.plan_name}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Status</p>
              <p className={`font-medium ${clientData?.status === "Banned" ? "text-red-500" : "text-green-500"}`}>
                {clientData?.status}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <button 
              className="w-full flex items-center px-4 py-2 bg-[#003366] text-white rounded-md hover:bg-[#004080] transition-colors"
              onClick={handleUsersClick}
            >
              <Users className="mr-2 h-5 w-5" />
              Manage Users
            </button>
            <button 
              className="w-full flex items-center px-4 py-2 bg-[#003366] text-white rounded-md hover:bg-[#004080] transition-colors"
              onClick={handleProductsClick}
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              Manage Products
            </button>
          </div>
        </div>

        {/* License Details Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">License Details</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Issue Date</p>
                  <p className="font-medium">
                    {new Date(clientData?.issue_date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expiry Date</p>
                  <p className="font-medium">
                    {new Date(clientData?.expiry_date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{clientData?.duration} Days</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Limits Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">User Limits</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Customer Logins</span>
              <span className="font-medium">{clientData?.customers_login}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Sales Manager Logins</span>
              <span className="font-medium">{clientData?.sales_mgr_login}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Super Admin Logins</span>
              <span className="font-medium">{clientData?.superadmin_login}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 