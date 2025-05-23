import React, { useEffect, useState, useMemo } from 'react';
import { getAdminOrders, getUsers, getAssignedUsers } from '../services/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';
import { Calendar } from "lucide-react";
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { format, startOfDay, endOfDay } from 'date-fns';
import logo from '/assets/logo.jpg'; // Logo import

function AdminOrdersReport() {
  const [admins, setAdmins] = useState([]);
  const [adminOrders, setAdminOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState([
    {
      startDate: startOfDay(new Date()),
      endDate: endOfDay(new Date()),
      key: 'selection',
    }
  ]);
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const userData = await getUsers();
        const adminUsers = userData.filter((user) => user.role === "admin");
        setAdmins(adminUsers);
      } catch (error) {
        toast.error("Failed to fetch admins.");
        setError("Failed to fetch admin data. Please try again.");
      }
    };
    fetchAdmins();
  }, []);

  useEffect(() => {
    const fetchAdminOrdersData = async () => {
      if (admins.length === 0) return;

      setLoading(true);
      setError(null);
      const ordersForAdmins = {};

      try {
        // Parallelize API calls for all admins
        const adminPromises = admins.map(async (admin) => {
          try {
            const [ordersResponse, assignedUsersResponse] = await Promise.all([
              getAdminOrders(admin.id),
              getAssignedUsers(admin.id)
            ]);

            let adminRouteData = 'N/A';
            let assignedUsersMap = {};

            if (assignedUsersResponse.success && assignedUsersResponse.assignedUsers) {
              assignedUsersMap = assignedUsersResponse.assignedUsers.reduce((map, user) => {
                map[user.cust_id] = user.route;
                return map;
              }, {});

              const routes = [...new Set(assignedUsersResponse.assignedUsers.map(user => user.route).filter(route => route))];
              adminRouteData = routes.length > 0 ? routes.join(', ') : 'No Route Assigned';
            } else {
              adminRouteData = 'Route Fetch Failed';
            }

            if (ordersResponse.success) {
              const ordersWithCustomerRoute = ordersResponse.orders.map(order => ({
                ...order,
                customer_route: assignedUsersMap[order.customer_id] || 'N/A'
              }));

              return [admin.id, {
                orders: ordersWithCustomerRoute,
                routeData: adminRouteData
              }];
            }
            return [admin.id, { orders: [], routeData: adminRouteData }];
          } catch (error) {
            console.log(`Error fetching data for admin ${admin.username} (ID: ${admin.id}):`, error);
            return [admin.id, { orders: [], routeData: 'Error' }];
          }
        });

        const results = await Promise.all(adminPromises);
        results.forEach(([adminId, data]) => {
          ordersForAdmins[adminId] = data;
        });

        setAdminOrders(ordersForAdmins);
      } catch (error) {
        setError("Failed to fetch orders. Please try again.");
        toast.error("Error fetching orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminOrdersData();
  }, [admins]);

  const filteredAdminOrders = useMemo(() => {
    const filteredOrders = {};
    admins.forEach(admin => {
      const adminId = admin.id;
      const adminOrderData = adminOrders[adminId];
      const orders = adminOrderData?.orders || [];
      filteredOrders[adminId] = {
        orders: orders.filter(order => {
          if (!order.placed_on) return false;
          const orderDate = new Date(order.placed_on * 1000);
          const startDate = dateRange[0].startDate;
          const endDate = dateRange[0].endDate;
          return orderDate >= startDate && orderDate <= endDate;
        }),
        routeData: adminOrderData?.routeData
      };
    });
    return filteredOrders;
  }, [adminOrders, dateRange, admins]);

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    admins.forEach(admin => {
      const adminId = admin.id;
      const adminFilteredData = filteredAdminOrders[adminId] || {};
      const orders = adminFilteredData.orders || [];

      if (orders.length > 0) {
        const sheetData = [
          ["Order ID", "Customer ID", "Customer Route", "Total Amount", "Order Type", "Placed On", "Cancelled", "Loading Slip", "Approve Status", "Delivery Status"],
          ...orders.map(order => [
            order.id,
            order.customer_id,
            order.customer_route,
            order.total_amount,
            order.order_type,
            format(new Date(order.placed_on * 1000), 'dd-MM-yyyy HH:mm:ss'),
            order.cancelled,
            order.loading_slip,
            order.approve_status,
            order.delivery_status
          ])
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, `Admin ${admin.username} Orders`);
      } else {
        const worksheet = XLSX.utils.aoa_to_sheet([[`No orders found for Admin: ${admin.username} for selected date range.`]]);
        XLSX.utils.book_append_sheet(workbook, worksheet, `Admin ${admin.username} Orders`);
      }
    });

    XLSX.writeFile(workbook, "AdminOrdersReport.xlsx");
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Logo */}
        <img 
          src={logo}
          alt="Order Appu Admin Panel Logo" 
          className="w-20 h-20 mx-auto mb-6 object-contain"
        />

        {/* Header */}
        <h2 className="text-3xl font-semibold text-center text-[#003366] mb-8">
          Orders Dashboard
        </h2>

        {/* Date Picker and Export Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative">
            <button
              onClick={() => setDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center px-4 py-2 bg-[#003366] text-white rounded-md hover:bg-[#005599] text-sm font-medium"
            >
              <Calendar className="mr-2 h-5 w-5" />
              {format(dateRange[0].startDate, 'yyyy-MM-dd')} - {format(dateRange[0].endDate, 'yyyy-MM-dd')}
            </button>
            {isDatePickerOpen && (
              <div className="absolute z-10 mt-2 bg-white shadow-lg rounded-md">
                <DateRangePicker
                  onChange={item => {
                    setDateRange([item.selection]);
                    setDatePickerOpen(false);
                  }}
                  ranges={dateRange}
                  direction="horizontal"
                />
              </div>
            )}
          </div>
          <button
            onClick={exportToExcel}
            className="px-6 py-2 bg-[#003366] text-white rounded-md hover:bg-[#005599] text-sm font-medium"
          >
            Export Report
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8 text-gray-600 text-lg">
            Loading admin order data...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8 text-red-600 text-lg">
            Error: {error}
          </div>
        )}

        {/* Orders Table */}
        {!loading && !error && (
          <div className="space-y-6">
            {admins.map(admin => (
              <div key={admin.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Orders for Admin: <span className="text-[#003366]">{admin.username}</span> (ID: {admin.id}) - Routes: {filteredAdminOrders[admin.id]?.routeData || 'N/A'}
                </h3>
                {filteredAdminOrders[admin.id]?.orders?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Order ID</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Customer ID</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Customer Route</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Total Amount</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Order Type</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Placed On</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Cancelled</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Loading Slip</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Approve Status</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Delivery Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAdminOrders[admin.id].orders.map((order, index) => (
                          <tr key={order.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-6 py-4 text-sm text-gray-900">{order.id}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{order.customer_id}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{order.customer_route || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{order.total_amount}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{order.order_type}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{new Date(order.placed_on * 1000).toLocaleDateString('en-GB')}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{String(order.cancelled)}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{order.loading_slip}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{order.approve_status}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{order.delivery_status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm py-4">No orders found for this admin for the selected date range.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminOrdersReport;