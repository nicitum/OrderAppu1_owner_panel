import React, { useState } from "react";

export default function UserTable({ users, isLoading, userStatuses, onEditUser, onToggleBlock }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const superadminUsers = users.filter(user => user.role === 'superadmin');
  const regularUsers = users.filter(user => user.role === 'user');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const renderUserRow = (user, isSuperadmin = false) => {
    const status = userStatuses?.[user.customer_id] || 'active';
    const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);

    return (
      <tr key={user.customer_id} className={`${isSuperadmin ? 'bg-purple-50' : 'bg-white'} hover:bg-gray-50`}>
        <td className="w-1/3 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          <div className="flex items-center">
            {user.username}
        {isSuperadmin && (
          <span className="ml-2 px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full">
            Superadmin
          </span>
        )}
          </div>
      </td>
        <td className="w-1/3 px-6 py-4 whitespace-nowrap text-sm font-medium">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            status === "active"
            ? "text-green-700 bg-green-100" 
            : "text-red-700 bg-red-100"
        }`}>
            {displayStatus}
        </span>
      </td>
        <td className="w-1/3 px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setSelectedUser(user);
                setShowDetailsModal(true);
              }}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              Display
            </button>
            {onEditUser && (
              <button
                onClick={() => onEditUser(user)}
                className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
              >
                Alter
            </button>
          )}
          {onToggleBlock && (
            <button
                onClick={() => onToggleBlock(user.customer_id, status)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  status === "active"
                    ? "text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100"
                    : "text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100"
              }`}
            >
                {status === "active" ? "Block" : "Unblock"}
            </button>
          )}
        </div>
      </td>
    </tr>
    );
  };

  const UserDetailsModal = ({ user, onClose }) => {
    if (!user) return null;

    const status = userStatuses?.[user.customer_id] || user.status || 'active';
    const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 py-2 border-b">
            <h3 className="text-xl font-semibold text-gray-900">User Details</h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-light"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Row 1 */}
            <div><Info label="Business Name" value={user.username} /></div>
            <div><Info label="Alias" value={user.alias || '-'} /></div>
            {/* Row 2 */}
            <div><Info label="Customer Name" value={user.name} /></div>
            <div><Info label="Customer Code" value={user.customer_id} /></div>
            {/* Row 3 */}
            <div><Info label="Mobile Number" value={user.phone} /></div>
            <div><Info label="Email" value={user.email} /></div>
            {/* Row 4 */}
            <div><Info label="Address Line 1" value={user.address_line1 || '-'} /></div>
            <div><Info label="City" value={user.city} /></div>
            {/* Row 5 */}
            <div><Info label="Address Line 2" value={user.address_line2 || '-'} /></div>
            <div><Info label="Route" value={user.route || '-'} /></div>
            {/* Row 6 */}
            <div><Info label="Address Line 3" value={user.address_line3 || '-'} /></div>
            <div><Info label="Country" value="India" /></div>
            {/* Row 7 */}
            <div><Info label="Address Line 4" value={user.address_line4 || '-'} /></div>
            <div><Info label="State" value={user.state} /></div>
            {/* Row 8 */}
            <div><Info label="GST Number" value={user.gst_number || '-'} /></div>
            <div><Info label="Pin Code" value={user.zip_code} /></div>
            {/* Delivery Address (full width) */}
            <div className="md:col-span-2"><Info label="Delivery Address" value={user.delivery_address || '-'} /></div>
            {/* Status (full width) */}
            <div className="md:col-span-2"><Info label="Status" value={
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                status === "active" ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
              }`}>
                {displayStatus}
              </span>
            } /></div>
          </div>
        </div>
      </div>
    );
  };

  const Info = ({ label, value }) => (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );

  return (
    <div className="flex flex-col space-y-10">
      {/* Superadmin Section */}
      {superadminUsers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-purple-700 mb-4 px-6">Superadmins</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40" style={{width: '10rem'}}>
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40" style={{width: '10rem'}}>
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {superadminUsers.map(user => renderUserRow(user, true))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Regular Users Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-4 px-6">Customers</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40" style={{width: '10rem'}}>
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40" style={{width: '10rem'}}>
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {regularUsers.map(user => renderUserRow(user))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showDetailsModal && selectedUser && (
        <UserDetailsModal 
          user={selectedUser} 
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }} 
        />
      )}
    </div>
  );
}
