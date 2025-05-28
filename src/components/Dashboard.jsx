import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import AdminRoutes from './AdminRoutes';
import AdminUserDetails from './AdminUsersDetails';
import AdminOrdersReport from './AdminOrdersReport';
import TallyInvoiceReport from './TallyInvoiceReport';
import Home from './Home';
import UsersTab from './UsersTab';
import ProductsTab from './ProductsTab';
import RouteMaster from './RouteMaster';
import SalesmanMaster from './SalesmanMaster';
import BrandsMaster from './BrandsMaster';
import CategoriesMaster from './CategoriesMaster';
import UnitsMaster from './UnitsMaster';
import StockGroupsMaster from './StockGroupsMaster';
import ChangePassword from '../pages/ChangePassword.jsx';

export default function Dashboard() {
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    // Retrieve the logged-in user from localStorage
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user) {
      setLoggedInUser(user);
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto p-6">
        {/* Display "Logged in as" if a user is logged in */}
        {loggedInUser && (
          <div className="mb-4">
            <h2 className="text-xl font-bold">
              Logged in as{" "}
              {loggedInUser?.role === "superadmin"
                ? "SUPER ADMIN"
                : loggedInUser?.role?.toUpperCase() || "UNKNOWN"}
            </h2>
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/users" element={<UsersTab />} />
          <Route path="/products" element={<ProductsTab />} />
          <Route path="/adminRoutes" element={<AdminRoutes />} />
          <Route path="/adminusersDetails" element={<AdminUserDetails />} />
          <Route path="/adminordersreport" element={<AdminOrdersReport />} />
          <Route path="/tallyinvoicereport" element={<TallyInvoiceReport />} />
          <Route path="/brands" element={<BrandsMaster />} />
          <Route path="/categories" element={<CategoriesMaster />} />
          <Route path="/units" element={<UnitsMaster />} />
          <Route path="/routes" element={<RouteMaster />} />
          <Route path="/stockgroups" element={<StockGroupsMaster />} />
          <Route path="/salesmen" element={<SalesmanMaster />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
