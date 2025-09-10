import React, { useState } from 'react';
import { Link, NavLink } from "react-router-dom";

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-blue-100 px-4 py-3 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link 
          to="/" 
          className="text-xl font-bold tracking-wider text-blue-600 hover:text-blue-500 transition-colors duration-300"
          onClick={closeMenu}
        >
          <span className="bg-blue-600 text-white px-2 py-1 rounded-md mr-1">S</span>
          hirtHub
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 text-sm">
          <NavLink 
            to="/men" 
            className={({ isActive }) => 
              `px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                isActive 
                  ? "bg-blue-100 text-blue-700 border border-blue-200" 
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`
            }
          >
            Mens
          </NavLink>
          <NavLink 
            to="/women" 
            className={({ isActive }) => 
              `px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                isActive 
                  ? "bg-blue-100 text-blue-700 border border-blue-200" 
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`
            }
          >
            Womens
          </NavLink>
          <NavLink 
            to="/objects" 
            className={({ isActive }) => 
              `px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                isActive 
                  ? "bg-blue-100 text-blue-700 border border-blue-200" 
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`
            }
          >
            Objects
          </NavLink>
        </nav>

        {/* Desktop Secondary Navigation */}
        <div className="hidden md:flex items-center gap-5 text-sm">
          <NavLink 
            to="/login" 
            className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium px-3 py-2 hover:bg-blue-50 rounded-lg"
          >
            Login
          </NavLink>
          <NavLink 
            to="/register" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300 font-medium border border-blue-600 hover:border-blue-700"
          >
            Register
          </NavLink>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button 
            onClick={toggleMenu}
            className="text-blue-600 focus:outline-none p-2 rounded-lg hover:bg-blue-50 transition-colors duration-300"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden transition-all duration-300 ease-in-out ${
        isMenuOpen ? 'max-h-96 opacity-100 pt-3' : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        <div className="container mx-auto py-4 space-y-3 bg-white rounded-lg shadow-lg border border-blue-100">
          {/* Primary Links */}
          <div className="space-y-2">
            <NavLink 
              to="/men" 
              onClick={closeMenu}
              className={({ isActive }) => 
                `block px-4 py-3 rounded-lg transition-all duration-300 font-medium ${
                  isActive 
                    ? "bg-blue-100 text-blue-700 border border-blue-200" 
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                }`
              }
            >
              Mens
            </NavLink>
            <NavLink 
              to="/women" 
              onClick={closeMenu}
              className={({ isActive }) => 
                `block px-4 py-3 rounded-lg transition-all duration-300 font-medium ${
                  isActive 
                    ? "bg-blue-100 text-blue-700 border border-blue-200" 
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                }`
              }
            >
              Womens
            </NavLink>
            <NavLink 
              to="/objects" 
              onClick={closeMenu}
              className={({ isActive }) => 
                `block px-4 py-3 rounded-lg transition-all duration-300 font-medium ${
                  isActive 
                    ? "bg-blue-100 text-blue-700 border border-blue-200" 
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                }`
              }
            >
              Objects
            </NavLink>
          </div>

          {/* Divider */}
          <div className="border-t border-blue-100 my-3"></div>

          {/* Secondary Links */}
          <div className="space-y-2">
            <NavLink 
              to="/login" 
              onClick={closeMenu}
              className="block px-4 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-300 font-medium"
            >
              Login
            </NavLink>
            <NavLink 
              to="/register" 
              onClick={closeMenu}
              className="block px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 text-center font-medium border border-blue-600 hover:border-blue-700"
            >
              Register
            </NavLink>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;