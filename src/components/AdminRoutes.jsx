import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getUsers, saveAssignment, getAssignedRoutes } from "../services/api";
import logo from "/assets/logo.jpg"; // Logo import

const AdminRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [newRoute, setNewRoute] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [assignedRoutesData, setAssignedRoutesData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userData = await getUsers();
        const adminUsers = userData.filter((user) => user.role === "admin");
        setUsers(adminUsers);

        const allRoutes = new Set();
        userData.forEach((user) => {
          if (user.route) {
            allRoutes.add(user.route);
          }
        });

        setRoutes([...allRoutes]);
      } catch (error) {
        toast.error("Failed to fetch users");
      }
    };

    fetchUsers();
  }, []);

  const fetchAssignedRoutes = async () => {
    if (!selectedAdmin) {
      toast.error("Please select an admin to view assigned routes.");
      return;
    }

    try {
      const response = await getAssignedRoutes({ admin_id: selectedAdmin });
      const filteredRoutes = (response || []).filter(route => route.route && route.route.trim() !== "");
      setAssignedRoutesData(filteredRoutes);
    } catch (error) {
      toast.error("Failed to fetch assigned routes");
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    fetchAssignedRoutes();
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleRouteSelection = (event) => {
    const selected = Array.from(event.target.selectedOptions, (option) => option.value);
    setSelectedRoutes(selected);
  };

  const handleAdminChange = (event) => {
    setSelectedAdmin(event.target.value);
  };

  const addNewRoute = () => {
    if (!newRoute.trim()) {
      toast.error("Route name cannot be empty.");
      return;
    }
    if (routes.includes(newRoute)) {
      toast.error("This route already exists.");
      return;
    }

    setRoutes((prevRoutes) => [...prevRoutes, newRoute]);
    setNewRoute("");
    toast.success("New route added successfully!");
  };

  const saveRoutes = async () => {
    if (!selectedAdmin || selectedRoutes.length === 0) {
      toast.error("Please select an admin and at least one route.");
      return;
    }

    const adminId = Number(selectedAdmin);
    try {
      const selectedAdminUser = users.find((user) => user.id === adminId);
      const customerId = selectedAdminUser ? selectedAdminUser.customer_id : null;

      if (!customerId) {
        toast.error("Selected admin does not have a valid customer_id.");
        return;
      }

      const response = await getAssignedRoutes();
      const allAssignedRoutes = response || [];

      const conflictRoutes = selectedRoutes.filter((route) =>
        allAssignedRoutes.includes(route)
      );

      if (conflictRoutes.length > 0) {
        toast.error("The following routes are already assigned to other admins.");
        return;
      }

      const result = await saveAssignment(customerId, selectedRoutes);

      if (result.success) {
        toast.success("Routes updated successfully!");
      } else {
        toast.error(result.message || "Failed to update routes.");
      }
    } catch (error) {
      toast.error("Error while saving routes. Please check if routes are already assigned.");
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Logo */}
        <img 
          src={logo} 
          alt="Order Appu Admin Panel Logo" 
          className="w-20 h-20 mx-auto mb-6 object-contain"
        />

        {/* Header */}
        <h2 className="text-3xl font-semibold text-center text-[#003366] mb-8">
          Assign Routes to Admin
        </h2>

        {/* Select Admin Dropdown */}
        <div className="mb-6">
          <label htmlFor="admin" className="block text-sm font-medium text-gray-700 mb-2">
            Select Admin
          </label>
          <select
            id="admin"
            value={selectedAdmin || ""}
            onChange={handleAdminChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-sm"
          >
            <option value="">Select Admin</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
        </div>

        {/* Select Routes Dropdown */}
        <div className="mb-6">
          <label htmlFor="routes" className="block text-sm font-medium text-gray-700 mb-2">
            Select Routes
          </label>
          <select
            id="routes"
            multiple
            value={selectedRoutes}
            onChange={handleRouteSelection}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-sm max-h-40 overflow-y-auto"
          >
            {routes.length === 0 ? (
              <option>No routes available</option>
            ) : (
              routes.map((route, index) => (
                <option key={index} value={route}>
                  {route}
                </option>
              ))
            )}
          </select>
        </div>

        {/* New Route Input and Button */}
        <div className="mb-6 flex items-center gap-4">
          <input
            type="text"
            value={newRoute}
            onChange={(e) => setNewRoute(e.target.value)}
            placeholder="Enter new route"
            className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-sm"
          />
          <button
            onClick={addNewRoute}
            className="px-6 py-3 bg-[#003366] text-white rounded-md hover:bg-[#005599] transition duration-200 text-sm font-medium"
          >
            Add Route
          </button>
        </div>

        {/* Save and Show Assigned Routes Buttons */}
        <div className="flex justify-between mb-6">
          <button
            onClick={saveRoutes}
            className="px-6 py-3 bg-[#003366] text-white rounded-md hover:bg-[#005599] transition duration-200 text-sm font-medium"
          >
            Save Routes
          </button>
          <button
            onClick={openModal}
            className="px-6 py-3 bg-[#003366] text-white rounded-md hover:bg-[#005599] transition duration-200 text-sm font-medium"
          >
            Show Assigned Routes
          </button>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-[#003366]">Assigned Routes</h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Route</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Admin Name</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Customer ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedRoutesData.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                            No routes assigned
                          </td>
                        </tr>
                      ) : (
                        assignedRoutesData.map((route, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-6 py-4 text-sm text-gray-900">{route.route}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{route.username}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{route.customer_id}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRoutes;