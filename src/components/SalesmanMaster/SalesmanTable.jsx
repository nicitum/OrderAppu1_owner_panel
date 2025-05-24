import React from 'react';
import { Edit, Ban, CheckCircle } from 'lucide-react';

const SalesmanTable = ({ salesmen, isLoading, onToggleBlock, onEditSalesman }) => {
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Route
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
          {salesmen.map((salesman) => (
            <tr key={salesman.customer_id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {salesman.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {salesman.customer_id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {salesman.phone}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {salesman.route}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  salesman.status === "Active" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {salesman.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {onEditSalesman && (
                  <button
                    onClick={() => onEditSalesman(salesman)}
                    className="text-[#003366] hover:text-[#002244] mr-4"
                  >
                    <Edit className="h-5 w-5 inline" />
                  </button>
                )}
                <button
                  onClick={() => onToggleBlock(salesman.customer_id, salesman.status)}
                  className={`${
                    salesman.status === "Active"
                      ? "text-red-600 hover:text-red-900"
                      : "text-green-600 hover:text-green-900"
                  }`}
                >
                  {salesman.status === "Active" ? (
                    <Ban className="h-5 w-5 inline" />
                  ) : (
                    <CheckCircle className="h-5 w-5 inline" />
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SalesmanTable; 