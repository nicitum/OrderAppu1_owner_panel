import React, { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { fetchMostRecentOrderApi, placeAdminOrder, getUsers } from '../services/api';

const AutoOrderPage = () => {
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [orderStatuses, setOrderStatuses] = useState({});
  const [placingOrder, setPlacingOrder] = useState({});
  const [placementError, setPlacementError] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState('all');
  
  const routes = ['all', '55', '56', '57', '58', '59', '60', '61', '62', '63'];

  useEffect(() => {
    const fetchData = async () => {
      setLoadingUsers(true);
      setError(null);
      try {
        const users = await getUsers();
        setAssignedUsers(users);

        // Cache order statuses to avoid refetching
        const cachedStatuses = JSON.parse(localStorage.getItem('orderStatuses') || '{}');
        const newOrderStatuses = {};
        const customerIds = users.map(user => user.customer_id);

        // Only fetch uncached or stale statuses
        const promises = customerIds.flatMap(id => {
          const cache = cachedStatuses[id];
          const isStale = !cache || (Date.now() - cache.timestamp) > 3600000; // 1-hour TTL
          if (isStale) {
            return [
              fetchMostRecentOrderApi(id, 'AM').catch(err => ({ error: err, customerId: id, type: 'AM' })),
              fetchMostRecentOrderApi(id, 'PM').catch(err => ({ error: err, customerId: id, type: 'PM' }))
            ];
          }
          return [];
        });

        const responses = await Promise.all(promises);
        customerIds.forEach(id => {
          const cache = cachedStatuses[id];
          if (cache && (Date.now() - cache.timestamp) <= 3600000) {
            newOrderStatuses[id] = cache.data;
          } else {
            const amResponse = responses.find(r => r.customerId === id && r.type === 'AM') || { order: null };
            const pmResponse = responses.find(r => r.customerId === id && r.type === 'PM') || { order: null };
            newOrderStatuses[id] = {
              am: amResponse.error ? null : (amResponse.order || null),
              pm: pmResponse.error ? null : (pmResponse.order || null)
            };
          }
        });

        setOrderStatuses(newOrderStatuses);
        localStorage.setItem('orderStatuses', JSON.stringify(
          Object.entries(newOrderStatuses).reduce((acc, [id, data]) => {
            acc[id] = { data, timestamp: Date.now() };
            return acc;
          }, {})
        ));
      } catch (err) {
        setError('Failed to fetch users or orders.');
        toast.error('Failed to fetch users or orders.');
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchData();
  }, []);

  const filteredUsers = useMemo(() => {
    return selectedRoute === 'all'
      ? assignedUsers
      : assignedUsers.filter(user => user.route === selectedRoute);
  }, [selectedRoute, assignedUsers]);

  const handleSelectAllCheckbox = useCallback(() => {
    setSelectAll(prev => !prev);
    setSelectedUsers(prev => prev.length === filteredUsers.length ? [] : filteredUsers.map(user => user.customer_id));
  }, [filteredUsers]);

  const handleCheckboxChange = useCallback((customerId) => {
    setSelectedUsers(prev =>
      prev.includes(customerId) ? prev.filter(id => id !== customerId) : [...prev, customerId]
    );
  }, []);

  const handleBulkPlaceOrder = useCallback(async (orderType) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to place orders for.');
      return;
    }

    setPlacingOrder(prev => ({ ...prev, [orderType]: true }));
    setPlacementError(prev => ({ ...prev, [orderType]: null }));
    let bulkOrderSuccess = true;

    const orderPromises = selectedUsers.map(async (customerId) => {
      try {
        const recentOrder = await fetchMostRecentOrderApi(customerId, orderType);
        const referenceOrderId = recentOrder.order ? recentOrder.order.id : null;

        if (referenceOrderId) {
          await placeAdminOrder(customerId, orderType, referenceOrderId);
          const updatedAm = orderType === 'AM' ? (await fetchMostRecentOrderApi(customerId, 'AM')).order : orderStatuses[customerId].am;
          const updatedPm = orderType === 'PM' ? (await fetchMostRecentOrderApi(customerId, 'PM')).order : orderStatuses[customerId].pm;
          setOrderStatuses(prev => ({
            ...prev,
            [customerId]: { am: updatedAm || null, pm: updatedPm || null }
          }));
        } else {
          toast.error(`No recent ${orderType} order for Customer ID: ${customerId}`);
          bulkOrderSuccess = false;
        }
      } catch (err) {
        toast.error(`Failed to place ${orderType} order for ${customerId}`);
        bulkOrderSuccess = false;
      }
    });

    await Promise.all(orderPromises);

    setSelectedUsers([]);
    setSelectAll(false);
    setPlacingOrder(prev => ({ ...prev, [orderType]: false }));

    if (bulkOrderSuccess) {
      toast.success(`Successfully placed ${orderType} orders for selected users.`);
      setSuccessMessage(`Successfully placed ${orderType} orders for selected users.`);
    } else {
      setError(`Failed to place all ${orderType} orders. Check individual user statuses.`);
      toast.error(`Failed to place all ${orderType} orders.`);
    }
  }, [selectedUsers, orderStatuses]);

  const getOrderStatusDisplay = useCallback((order) => {
    if (order && order.placed_on != null) {
      const date = new Date(order.placed_on * 1000);
      return `Placed on: ${date.toLocaleDateString('en-GB')}`;
    }
    return 'No Order Placed';
  }, []);

  const getHasOrderTodayDisplay = useCallback((order, orderType) => {
    const today = new Date();
    const isSameDay = (date1, date2) =>
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();

    if (order && order.placed_on != null) {
      const orderDate = new Date(order.placed_on * 1000);
      if ((orderType === 'AM' || orderType === 'PM') && isSameDay(orderDate, today)) {
        return 'Yes';
      }
    }
    return 'No';
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Logo */}
        <img 
          src="/assets/logo.jpg" 
          alt="Order Appu Admin Panel Logo" 
          className="w-20 h-20 mx-auto mb-6 object-contain"
        />

        {/* Header */}
        <h2 className="text-3xl font-semibold text-center text-[#003366] mb-8">
          Order Management Dashboard
        </h2>

        {/* Loading State */}
        {loadingUsers && (
          <div className="text-center py-8 text-gray-600 text-lg">
            Loading users and orders...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6 text-center">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 text-green-700 p-4 rounded-md mb-6">
            {successMessage}
          </div>
        )}

        {/* Filter and Actions */}
        {!loadingUsers && !error && (
          <>
            <div className="flex items-center gap-4 mb-6">
              <label htmlFor="route-filter" className="text-sm font-medium text-gray-700">
                Filter by Route:
              </label>
              <select
                id="route-filter"
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003366] text-sm"
              >
                {routes.map(route => (
                  <option key={route} value={route}>
                    {route === 'all' ? 'All Routes' : `Route ${route}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAllCheckbox}
                  disabled={filteredUsers.length === 0}
                  className="h-4 w-4 text-[#003366] focus:ring-[#003366] border-gray-300 rounded"
                />
                <label className="text-sm font-medium text-gray-700">Select All</label>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => handleBulkPlaceOrder('AM')}
                  disabled={selectedUsers.length === 0 || placingOrder['AM']}
                  className={`px-6 py-2 rounded-md text-sm font-medium text-white ${
                    placingOrder['AM']
                      ? 'bg-gray-400 cursor-wait'
                      : 'bg-[#003366] hover:bg-[#005599]'
                  }`}
                >
                  Place AM Orders
                </button>
                <button
                  onClick={() => handleBulkPlaceOrder('PM')}
                  disabled={selectedUsers.length === 0 || placingOrder['PM']}
                  className={`px-6 py-2 rounded-md text-sm font-medium text-white ${
                    placingOrder['PM']
                      ? 'bg-gray-400 cursor-wait'
                      : 'bg-[#003366] hover:bg-[#005599]'
                  }`}
                >
                  Place PM Orders
                </button>
              </div>
            </div>

            {/* User List */}
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              {filteredUsers.map(user => (
                <div key={user.customer_id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-center gap-4 mb-4 flex-wrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.customer_id)}
                      onChange={() => handleCheckboxChange(user.customer_id)}
                      className="h-4 w-4 text-[#003366] focus:ring-[#003366] border-gray-300 rounded"
                    />
                    <div className="text-sm text-gray-600">
                      <p><strong>Customer ID:</strong> {user.customer_id}</p>
                      <p><strong>Route:</strong> {user.route}</p>
                      <p><strong>Auto AM:</strong> {user.auto_am_order}</p>
                      <p><strong>Auto PM:</strong> {user.auto_pm_order}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 border border-gray-200 rounded-md">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">AM Order</h4>
                      <p className="text-sm text-gray-600">
                        {placementError[user.customer_id] || getOrderStatusDisplay(orderStatuses[user.customer_id]?.am)}
                      </p>
                      <p className={`text-sm font-medium mt-2 ${
                        getHasOrderTodayDisplay(orderStatuses[user.customer_id]?.am, 'AM') === 'Yes' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Today: {getHasOrderTodayDisplay(orderStatuses[user.customer_id]?.am, 'AM')}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 rounded-md">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">PM Order</h4>
                      <p className="text-sm text-gray-600">
                        {placementError[user.customer_id] || getOrderStatusDisplay(orderStatuses[user.customer_id]?.pm)}
                      </p>
                      <p className={`text-sm font-medium mt-2 ${
                        getHasOrderTodayDisplay(orderStatuses[user.customer_id]?.pm, 'PM') === 'Yes' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Today: {getHasOrderTodayDisplay(orderStatuses[user.customer_id]?.pm, 'PM')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && !error && (
                <p className="text-center text-gray-600 text-sm py-4 col-span-full">
                  No users found for the selected route.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AutoOrderPage;