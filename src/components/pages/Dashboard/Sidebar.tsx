// src/components/Sidebar.jsx
import {
  FaTachometerAlt,
  FaStar,
  FaShoppingCart,
  FaBox,
  FaChartLine,
  FaEnvelope,
  FaCog,
  FaSignOutAlt,
  FaChevronRight,
  FaTimes,
  FaBars
} from "react-icons/fa";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // กำหนดเส้นทางของแต่ละเมนูให้ตรงกับ Router ของโปรเจค
  const navItems = [
    { icon: <FaTachometerAlt />, text: "Dashboard",   to: "/" },
    { icon: <FaStar />,          text: "Leaderboard", to: "/leaderboard" },
    { icon: <FaShoppingCart />,  text: "Order",       to: "/orders" },
    { icon: <FaBox />,           text: "Products",    to: "/products" },
    { icon: <FaChartLine />,     text: "Sales Report",to: "/sales" },
    { icon: <FaEnvelope />,      text: "Messages",    to: "/messages", badge: 3 },
    { icon: <FaCog />,           text: "Settings",    to: "/settings" },
    { icon: <FaSignOutAlt />,    text: "Sign Out",    to: "/signout" },
  ];

  const toggleSidebar = () => setIsCollapsed((v) => !v);
  const toggleMobileSidebar = () => setIsMobileOpen((v) => !v);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-blue-600 text-white shadow-lg"
      >
        {isMobileOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-40 transform ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div
          className={`flex flex-col h-full bg-gradient-to-b from-blue-50 to-white border-r border-gray-200 shadow-xl ${
            isCollapsed ? "w-20" : "w-64"
          } transition-all duration-300`}
        >
          {/* Logo Section */}
          <div className="flex items-center justify-between h-20 border-b border-gray-200 px-4">
            {!isCollapsed && (
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Dabang
              </h1>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-blue-100 transition-colors duration-200 hidden lg:block"
            >
              <FaChevronRight
                className={`transform transition-transform ${
                  isCollapsed ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-8 space-y-1 overflow-y-auto">
            {navItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.to}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex items-center p-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-600 hover:bg-blue-100 hover:text-blue-600",
                    isCollapsed ? "justify-center" : ""
                  ].join(" ")
                }
              >
                {/* แถบซ้ายตอน active */}
                {location.pathname === item.to && !isCollapsed && (
                  <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />
                )}

                {/* Icon + Badge */}
                <div className={`${isCollapsed ? "" : "mr-3"} relative`}>
                  <div className="text-lg">{item.icon}</div>
                  {item.badge ? (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 grid place-items-center">
                      {item.badge}
                    </span>
                  ) : null}
                </div>

                {/* Label + Chevron (เฉพาะตอนไม่ย่อ) */}
                {!isCollapsed && (
                  <>
                    <span className="font-medium flex-1">{item.text}</span>
                    {location.pathname === item.to && (
                      <FaChevronRight className="text-sm opacity-70" />
                    )}
                  </>
                )}

                {/* Tooltip ตอนย่อ */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {item.text}
                    {item.badge ? (
                      <span className="ml-1 bg-red-500 text-white text-xs rounded-full inline-flex items-center justify-center h-4 w-4">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Profile Section */}
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                  U
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">User Name</p>
                  <p className="text-xs text-gray-500 truncate">admin@dabang.com</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
