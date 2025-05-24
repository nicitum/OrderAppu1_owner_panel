import React from 'react';

const SearchBar = ({ searchTerm, onSearchChange, placeholder = "Search salesmen...", className = "" }) => {
  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder={placeholder}
      className={`px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent ${className}`}
    />
  );
};

export default SearchBar; 