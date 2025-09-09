// src/components/DashboardContent.jsx
import { useState } from "react";
import {
  FiSearch,
  FiChevronDown,
  FiBell,
  FiShoppingCart,
  FiDollarSign,
  FiUsers,
  FiBox,
  FiTrendingUp,
  FiPieChart,
  FiMap,
  FiTarget
} from "react-icons/fi";

const DashboardContent = () => {
  const [activeTab, setActiveTab] = useState("daily");

  const stats = [
    { 
      title: "Today's Sales", 
      value: "$1,892", 
      change: "+1.5% from yesterday", 
      textColor: "text-blue-600", 
      bgColor: "bg-blue-100",
      icon: <FiDollarSign className="text-blue-600" />
    },
    { 
      title: "Total Orders", 
      value: "300", 
      change: "+5% from yesterday", 
      textColor: "text-purple-600", 
      bgColor: "bg-purple-100",
      icon: <FiShoppingCart className="text-purple-600" />
    },
    { 
      title: "Products Sold", 
      value: "512", 
      change: "+12% from yesterday", 
      textColor: "text-green-600", 
      bgColor: "bg-green-100",
      icon: <FiBox className="text-green-600" />
    },
    { 
      title: "New Customers", 
      value: "86", 
      change: "+8% from yesterday", 
      textColor: "text-amber-600", 
      bgColor: "bg-amber-100",
      icon: <FiUsers className="text-amber-600" />
    },
  ];

  const products = [
    { name: "Home Decor Range", popularity: 85, sales: "45%", color: "bg-blue-500" },
    { name: "Disney Princess Bag", popularity: 60, sales: "20%", color: "bg-purple-500" },
    { name: "Bathroom Essentials", popularity: 75, sales: "35%", color: "bg-green-500" },
    { name: "Apple Smartwatches", popularity: 50, sales: "25%", color: "bg-amber-500" },
  ];

  // Mock data for charts
  const visitorData = [65, 59, 80, 81, 56, 55, 40, 58, 75, 82, 90, 95];
  const revenueData = [1200, 1900, 1500, 2100, 1800, 2500, 2200, 2800, 3200, 3500, 3800, 4200];


  return (
    <div className="flex-1 p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col items-start justify-between space-y-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Welcome back, Syndtechdev! Here's what's happening today.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search here..."
              className="py-2 pl-10 pr-4 w-full md:w-64 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-white border border-gray-200 cursor-pointer">
            <span className="text-gray-600 text-sm">Eng (US)</span>
            <FiChevronDown className="text-gray-400" />
          </div>
          <div className="relative p-2 rounded-lg bg-white border border-gray-200 cursor-pointer">
            <FiBell className="text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              3
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <img
              src="https://marketplace.canva.com/m3zhI/MAEWdFm3zhI/1/tl/canva-human-face.-MAEWdFm3zhI.png"
              alt="profile"
              className="w-10 h-10 rounded-full border-2 border-blue-300"
            />
            <div className="hidden md:block text-sm">
              <p className="font-medium text-gray-800">Syndtechdev</p>
              <p className="text-blue-500">Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                {stat.icon}
              </div>
              <span className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</span>
            </div>
            <p className="mt-4 text-sm font-medium text-gray-600">{stat.title}</p>
            <p className={`text-xs mt-1 ${stat.change.includes("+") ? "text-green-500" : "text-red-500"}`}>
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Graphs Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Visitor Insights */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiTrendingUp className="mr-2 text-blue-500" /> Visitor Insights
            </h3>
            <select 
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="h-48 flex items-end space-x-1 pt-4">
            {visitorData.map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-blue-400 to-blue-600 rounded-t-lg"
                  style={{ height: `${value}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-1">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][index]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total Revenue */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiDollarSign className="mr-2 text-green-500" /> Total Revenue
            </h3>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">+12.5%</span>
          </div>
          <div className="h-48 flex items-end space-x-1 pt-4">
            {revenueData.map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-green-400 to-green-600 rounded-t-lg"
                  style={{ height: `${value / 50}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-1">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][index]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Target vs Reality */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiTarget className="mr-2 text-purple-500" /> Target vs Reality
            </h3>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">98%</span>
          </div>
          <div className="h-48 flex items-center justify-center">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-700">98%</span>
              </div>
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-gray-200 stroke-current"
                  strokeWidth="10"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                />
                <circle
                  className="text-purple-500 stroke-current"
                  strokeWidth="10"
                  strokeLinecap="round"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset="5" // 98% of 251.2 is ~246, so offset is 251.2-246=5.2
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Top Products */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="mb-4 font-semibold text-gray-800 flex items-center">
            <FiPieChart className="mr-2 text-blue-500" /> Top Products
          </h3>
          <ul className="space-y-4">
            {products.map((product, index) => (
              <li key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`w-3 h-3 ${product.color} rounded-full`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{product.name}</p>
                    <div className="w-full h-2 mt-1 bg-gray-200 rounded-full">
                      <div 
                        className={`h-2 ${product.color} rounded-full`} 
                        style={{ width: `${product.popularity}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600">{product.sales}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sales Mapping by Country */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="mb-4 font-semibold text-gray-800 flex items-center">
            <FiMap className="mr-2 text-green-500" /> Sales by Country
          </h3>
          <div className="h-48 relative bg-gradient-to-br from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <FiMap className="w-16 h-16 text-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-4 z-10">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-800">USA</div>
                <div className="text-sm text-gray-600">$42.5k</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-800">UK</div>
                <div className="text-sm text-gray-600">$28.3k</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-800">GER</div>
                <div className="text-sm text-gray-600">$35.4k</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-800">JPN</div>
                <div className="text-sm text-gray-600">$22.7k</div>
              </div>
            </div>
          </div>
        </div>

        {/* Volume vs Service Level */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="mb-4 font-semibold text-gray-800 flex items-center">
            <FiTrendingUp className="mr-2 text-purple-500" /> Volume vs Service
          </h3>
          <div className="h-48 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">85%</div>
                <div className="text-xs text-gray-600 mt-1">Service Level</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">1,284</div>
                <div className="text-xs text-gray-600 mt-1">Total Volume</div>
              </div>
              <div className="col-span-2 bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-lg text-white text-center">
                <div className="text-sm">Efficiency Ratio</div>
                <div className="text-xl font-bold mt-1">1.24:1</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;