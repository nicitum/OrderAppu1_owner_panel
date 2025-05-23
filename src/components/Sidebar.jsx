import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { CreditCard, MapPin, BarChart, Settings, ChevronDown, ChevronRight, Tag } from "lucide-react";
import LogoutButton from "./LogoutTab";
import logo from "/assets/logo.jpg"; // Logo import

const Sidebar = () => {
  const [adminRoutes, setAdminRoutes] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [mastersOpen, setMastersOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (loggedInUser) {
      setUserRole(loggedInUser.role);
      if (loggedInUser.role === "superadmin" && loggedInUser.routes) {
        setAdminRoutes(loggedInUser.routes);
      }
    }
  }, []);

  // Keep masters menu open if we're on a masters page
  useEffect(() => {
    if (location.pathname.includes('/brands')) {
      setMastersOpen(true);
    }
  }, [location.pathname]);

  return (
    <div className="h-screen w-64 text-white bg-gradient-to-b from-[#003366] to-[#005599] shadow-xl">
      <div className="p-6 text-center">
        <img 
          src={logo}
          alt="Order Appu Admin Panel Logo" 
          className="w-16 h-16 mx-auto mb-4 object-contain cursor-pointer"
          onClick={() => navigate('/dashboard')}
        />
        <h2 className="text-2xl font-bold">ORDER APPU</h2>
        <p className="text-sm font-medium opacity-90">
          {userRole === "superadmin" ? "Super Admin Panel" : "Admin Panel"}
        </p>
      </div>
      
      <nav className="mt-4 space-y-2 px-4">
        {/* Super Admin Only Routes */}
        {userRole === "superadmin" && (
          <>
            <NavLink
              to="/dashboard/adminRoutes"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded-lg transition-colors ${
                  isActive ? "bg-[#005599] text-white font-semibold" : "text-gray-100 hover:bg-[#004080]"
                }`
              }
            >
              <MapPin className="mr-3 h-5 w-5" />
              Routes Manager
            </NavLink>

            <NavLink
              to="/dashboard/adminusersDetails"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded-lg transition-colors ${
                  isActive ? "bg-[#005599] text-white font-semibold" : "text-gray-100 hover:bg-[#004080]"
                }`
              }
            >
              <CreditCard className="mr-3 h-5 w-5" />
              Admin User Details
            </NavLink>

            <NavLink
              to="/dashboard/adminordersreport"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded-lg transition-colors ${
                  isActive ? "bg-[#005599] text-white font-semibold" : "text-gray-100 hover:bg-[#004080]"
                }`
              }
            >
              <BarChart className="mr-3 h-5 w-5" />
              Orders Report
            </NavLink>

            <NavLink
              to="/dashboard/tallyinvoicereport"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded-lg transition-colors ${
                  isActive ? "bg-[#005599] text-white font-semibold" : "text-gray-100 hover:bg-[#004080]"
                }`
              }
            >
              <BarChart className="mr-3 h-5 w-5" />
              Tally Invoice Report
            </NavLink>

            {/* Masters Section */}
            <div className="relative">
              <button
                onClick={() => setMastersOpen(!mastersOpen)}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                  location.pathname.includes('/brands') ? 'bg-[#002244]' : 'hover:bg-[#002244]'
                }`}
              >
                <div className="flex items-center">
                  <Settings className="h-5 w-5 mr-3" />
                  Masters
                </div>
                {mastersOpen ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>

              {mastersOpen && (
                <div className="ml-8 mt-2 space-y-2">
                  <NavLink
                    to="/dashboard/users"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 text-sm ${
                        isActive
                          ? 'bg-[#005599] text-white font-semibold'
                          : 'text-gray-100 hover:bg-[#004080]'
                      }`
                    }
                  >
                    <Tag className="h-4 w-4 mr-3" />
                    Customer Masters
                  </NavLink>


                  <NavLink
                    to="/dashboard/routes"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 text-sm ${
                        isActive
                          ? 'bg-[#005599] text-white font-semibold'
                          : 'text-gray-100 hover:bg-[#004080]'
                      }`
                    }
                  >
                    <Tag className="h-4 w-4 mr-3" />
                    Route Masters
                  </NavLink>

                  
                  <NavLink
                    to="/dashboard/products"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 text-sm ${
                        isActive
                          ? 'bg-[#005599] text-white font-semibold'
                          : 'text-gray-100 hover:bg-[#004080]'
                      }`
                    }
                  >
                    <Tag className="h-4 w-4 mr-3" />
                    Product Masters
                  </NavLink>
                 
                  <NavLink
                    to="/dashboard/brands"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 text-sm ${
                        isActive
                          ? 'bg-[#005599] text-white font-semibold'
                          : 'text-gray-100 hover:bg-[#004080]'
                      }`
                    }
                  >
                    <Tag className="h-4 w-4 mr-3" />
                    Brand Masters
                  </NavLink>
                  <NavLink
                    to="/dashboard/categories"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 text-sm ${
                        isActive
                          ? 'bg-[#005599] text-white font-semibold'
                          : 'text-gray-100 hover:bg-[#004080]'
                      }`
                    }
                  >
                    <Tag className="h-4 w-4 mr-3" />
                    Category Masters
                  </NavLink>
                  <NavLink
                    to="/dashboard/units"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 text-sm ${
                        isActive
                          ? 'bg-[#005599] text-white font-semibold'
                          : 'text-gray-100 hover:bg-[#004080]'
                      }`
                    }
                  >
                    <Tag className="h-4 w-4 mr-3" />
                    UOM Masters
                  </NavLink>
                </div>
              )}
            </div>

            {/* Assigned Routes List */}
            {adminRoutes.length > 0 && (
              <div className="mt-6 px-4">
                <h3 className="text-lg font-semibold">Assigned Routes</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-100">
                  {adminRoutes.map((route, index) => (
                    <li key={index} className="text-sm">{route}</li>
                  ))}
                </ul>
              </div>
            )}

      

            {/* Logout at the very bottom */}
            <div className="mt-6 px-4">
              <LogoutButton />
            </div>
          </>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;