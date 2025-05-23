import React from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { LogOut } from "lucide-react"; // import logout icon from lucide-react

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all auth-related data
    localStorage.removeItem('authToken');
    localStorage.removeItem('loggedInUser');
    sessionStorage.clear(); // Clear any session data
    
    // Force clear any cached data
    window.location.href = '/login';
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center px-4 py-2 text-gray-100 hover:bg-[#004080] rounded-lg transition-colors"
    >
      <LogOut className="mr-3" />
      Logout
    </button>
  );
};

export default LogoutButton;
