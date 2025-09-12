// src/components/pages/Dashboard/Sidebar.tsx
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,

  FaBox,
  FaSignOutAlt,
  FaChevronRight,
  FaTimes,
  FaBars,
} from "react-icons/fa";

import type { AuthUser } from "../../../lib/auth";
import { getSessionUser, logout } from "../../../lib/auth";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const navigate = useNavigate();


  useEffect(() => {
    setUser(getSessionUser());
  }, []);

  const displayName =
    user?.name ?? (user?.email ? user.email.split("@")[0] : "User Name");
  const displayEmail = user?.email ?? "admin@dabang.com";

  const navItems: { icon: ReactNode; text: string; to: string }[] = [
    { icon: <FaTachometerAlt />, text: "Dashboard",          to: "/Dashboard" },
    { icon: <FaBox />,           text: "Product Management", to: "/Dashboard/ProductManagement" },

  ];

  const toggleSidebar = () => setIsCollapsed((v) => !v);
  const toggleMobileSidebar = () => setIsMobileOpen((v) => !v);
  const closeMobile = () => setIsMobileOpen(false);

  const onSignOut = () => {
    logout();
    navigate("/login"); // ปรับ path ตามโปรเจกต์
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-blue-600 text-white shadow-lg"
      >
        {isMobileOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={closeMobile} />
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
          {/* Logo */}
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
              <FaChevronRight className={`transform transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-8 space-y-1 overflow-y-auto">
            {navItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.to}
                end
                onClick={closeMobile}
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-600 hover:bg-blue-100 hover:text-blue-600"
                  } ${isCollapsed ? "justify-center" : ""}`
                }
              >

                {({ isActive }) => (

                  <>
                    {isActive && !isCollapsed && (
                      <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />
                    )}
                    <div className={`${isCollapsed ? "" : "mr-3"} text-lg`}>
                      {item.icon}
                    </div>
                    {!isCollapsed && (
                      <>
                        <span className="font-medium flex-1 truncate">{item.text}</span>
                        {isActive && <FaChevronRight className="text-sm opacity-70" />}
                      </>
                    )}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        {item.text}
                      </div>
                    )}
                  </>
                )}

              </NavLink>

            ))}

            {/* Sign Out */}
            <button
              onClick={onSignOut}
              className={`w-full text-left flex items-center p-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                "text-gray-600 hover:bg-blue-100 hover:text-blue-600"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <div className={`${isCollapsed ? "" : "mr-3"} text-lg`}>
                <FaSignOutAlt />
              </div>
              {!isCollapsed && <span className="font-medium flex-1">Sign Out</span>}
            </button>
          </nav>

          {/* User Profile */}
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <img
                  src={"https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(displayName)}
                  alt={displayName}
                  className="h-10 w-10 rounded-full ring-1 ring-gray-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
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
