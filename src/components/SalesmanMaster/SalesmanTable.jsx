import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUserBlockStatus, updateUserBlockStatus } from '../../services/api';

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

const SalesmanDetailsModal = ({ isOpen, onClose, salesman }) => {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    const loadSalesmanImage = async () => {
      if (salesman?.image) {
        try {
          const url = getSalesmanImageUrl(salesman.image);
          const img = new Image();
          
          try {
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = url;
            });
            setImageUrl(url);
          } catch (err) {
            const blobUrl = await fetchSalesmanImage(salesman.image);
            if (blobUrl) {
              setImageUrl(blobUrl);
            }
          }
        } catch (error) {
          console.error('Image load failed:', error);
          setImageUrl(null);
        }
      } else {
        setImageUrl(null);
      }
    };

    loadSalesmanImage();
    
    return () => {
      if (imageUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [salesman]);

  if (!isOpen || !salesman) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 py-2">
          <h2 className="text-2xl font-semibold text-gray-800">Salesman Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Image Display */}
          <div className="flex justify-center">
            <div className="relative w-40 h-40 rounded-full overflow-hidden border-2 border-gray-200">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={salesman.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <User className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
          </div>
          {/* Sales Man Name */}
          <div>
            <h4 className="text-sm font-medium text-gray-500">Sales Man Name</h4>
            <p className="mt-1 text-sm text-gray-900">{salesman.username}</p>
          </div>
          {/* Address */}
          <div>
            <h4 className="text-sm font-medium text-gray-500">Address</h4>
            <p className="mt-1 text-sm text-gray-900">{salesman.address_line1 || '-'}</p>
          </div>
          {/* Designation / Salesman Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Designation</h4>
              <p className="mt-1 text-sm text-gray-900">{salesman.designation || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Salesman Code</h4>
              <p className="mt-1 text-sm text-gray-900">{salesman.customer_id}</p>
            </div>
          </div>
          {/* Mobile No / Aadhar No */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Mobile No</h4>
              <p className="mt-1 text-sm text-gray-900">{salesman.phone}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Aadhar No</h4>
              <p className="mt-1 text-sm text-gray-900">{salesman.aadhar_number || '-'}</p>
            </div>
          </div>
          {/* PAN No / DL No */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500">PAN No</h4>
              <p className="mt-1 text-sm text-gray-900">{salesman.pan_number || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">DL No</h4>
              <p className="mt-1 text-sm text-gray-900">{salesman.dl_number || '-'}</p>
            </div>
          </div>
          {/* Route */}
          <div>
            <h4 className="text-sm font-medium text-gray-500">Route</h4>
            <p className="mt-1 text-sm text-gray-900">{salesman.route || '-'}</p>
          </div>
          {/* Notes */}
          <div>
            <h4 className="text-sm font-medium text-gray-500">Notes</h4>
            <p className="mt-1 text-sm text-gray-900">{salesman.notes || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SalesmanTable = ({ salesmen, isLoading, onToggleBlock, onEditSalesman }) => {
  const [selectedSalesman, setSelectedSalesman] = useState(null);
  const [blockStatuses, setBlockStatuses] = useState({});
  const [imageUrls, setImageUrls] = useState({});

  // Fetch block status for each salesman
  useEffect(() => {
    const fetchAllUserStatuses = async (usersList) => {
      const statuses = {};
      await Promise.all(
        usersList.map(async (user) => {
          try {
            const res = await getUserBlockStatus(user.customer_id);
            statuses[user.customer_id] = res.data.status || 'active';
          } catch (e) {
            statuses[user.customer_id] = 'active';
          }
        })
      );
      setBlockStatuses(statuses);
    };

    if (salesmen && salesmen.length > 0) {
      fetchAllUserStatuses(salesmen);
    }
  }, [salesmen]);

  // Load images for all salesmen
  useEffect(() => {
    const loadImages = async () => {
      const urls = {};
      await Promise.all(
        salesmen.map(async (salesman) => {
          if (salesman.image) {
            try {
              const url = getSalesmanImageUrl(salesman.image);
              const img = new Image();
              
              try {
                await new Promise((resolve, reject) => {
                  img.onload = resolve;
                  img.onerror = reject;
                  img.src = url;
                });
                urls[salesman.customer_id] = url;
              } catch (err) {
                const blobUrl = await fetchSalesmanImage(salesman.image);
                if (blobUrl) {
                  urls[salesman.customer_id] = blobUrl;
                }
              }
            } catch (error) {
              console.error(`Failed to load image for ${salesman.customer_id}:`, error);
            }
          }
        })
      );
      setImageUrls(urls);
    };

    if (salesmen && salesmen.length > 0) {
      loadImages();
    }

    return () => {
      // Cleanup blob URLs
      Object.values(imageUrls).forEach(url => {
        if (url?.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [salesmen]);

  const handleToggleBlock = async (customer_id, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "blocked" : "active";
      const response = await updateUserBlockStatus(customer_id, newStatus);
      if (response.status) {
        toast.success(response.message || `User status updated to ${newStatus}`);
        // Update local status
        setBlockStatuses(prev => ({
          ...prev,
          [customer_id]: newStatus
        }));
      } else {
        throw new Error(response.message || "Failed to update user status");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update user status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
      </div>
    );
  }

  if (!salesmen || salesmen.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No salesmen found
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {salesmen.map((salesman) => {
              const status = blockStatuses[salesman.customer_id] || salesman.status || 'active';
              const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
              return (
                <tr key={salesman.customer_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {salesman.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      status === "active"
                        ? "text-green-700 bg-green-100"
                        : "text-red-700 bg-red-100"
                    }`}>
                      {displayStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setSelectedSalesman(salesman)}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        Display
                      </button>
                      {onEditSalesman && (
                        <button
                          type="button"
                          onClick={() => onEditSalesman(salesman)}
                          className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                        >
                          Alter
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleBlock(salesman.customer_id, status)}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          status === "active"
                            ? "text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100"
                            : "text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100"
                        }`}
                      >
                        {status === "active" ? "Block" : "Unblock"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedSalesman && (
        <SalesmanDetailsModal
          isOpen={!!selectedSalesman}
          onClose={() => setSelectedSalesman(null)}
          salesman={selectedSalesman}
        />
      )}
    </>
  );
};

export default SalesmanTable;