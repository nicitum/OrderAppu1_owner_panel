import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import toast from 'react-hot-toast';
import { CircleUser, KeyRound, Loader2 } from 'lucide-react';
import { jwtDecode } from "jwt-decode";
import logo from '/assets/logo.jpg'; // Logo import

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const role = 'superadmin'; // Set role to 'superadmin' and make it constant
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log("Attempting login with:", { username, password, selectedRole: role });

      const response = await login(username, password, role); // API call
      console.log("Response from backend:", response);

      if (!response.token) {
        console.error("Login failed: No token received");
        toast.error("Unexpected error. Please try again.");
        return;
      }

      // Decode JWT token
      const decodedToken = jwtDecode(response.token);
      console.log("Decoded Token:", decodedToken);

      if (!decodedToken.role) {
        console.error("Decoded token missing role!");
        toast.error("Unexpected error: Role not found.");
        return;
      }

      // Validate role
      if (decodedToken.role !== role) {
        console.warn(`Access Denied: Expected Role - ${role}, Actual Role - ${decodedToken.role}`);
        toast.error(`Access Denied: You are not a ${role}`);
        return;
      }

      // Store token & role in local storage
      localStorage.setItem("token", response.token);
      localStorage.setItem("role", decodedToken.role);
      localStorage.setItem("loggedInUser", JSON.stringify({
        username: username,
        role: decodedToken.role
      }));

      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title Container */}
        <div className="text-center mb-8 transform hover:scale-105 transition-transform duration-300">
          <img 
            src={logo} 
            alt="Order Appu Admin Panel Logo" 
            className="w-24 h-24 mx-auto mb-4 object-contain rounded-full shadow-lg"
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#003366] to-[#005599] bg-clip-text text-transparent">
            ORDER APPU ADMIN
          </h1>
          <p className="text-gray-600 mt-2">Welcome back! Please sign in to continue.</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 transform hover:shadow-2xl transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Username</label>
              <div className="relative group">
                <CircleUser className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#003366] transition-colors" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all duration-200"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative group">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#003366] transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-[#003366] to-[#005599] text-white font-medium 
                hover:from-[#004080] hover:to-[#0066b3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003366] 
                transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed
                flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 mt-6 text-sm">
          © {new Date().getFullYear()} Order Appu Admin Panel. All rights reserved.
        </p>
      </div>
    </div>
  );
}