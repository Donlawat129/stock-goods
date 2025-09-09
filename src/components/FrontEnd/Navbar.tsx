import React from 'react';
import { Link, NavLink } from "react-router-dom";  // << เพิ่ม Link มาด้วย

const Navbar: React.FC = () => {
  return (
    <header className="bg-[#cedff3] px-8 py-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-xl tracking-[0.25em]">ShirtHub</Link>

        {/* Primary Navigation */}
        <nav className="hidden md:flex gap-8 text-sm">
          <NavLink to="/men" className="text-gray-600 hover:text-gray-900">Mens</NavLink>
          <NavLink to="/women" className="text-gray-600 hover:text-gray-900">Womens</NavLink>
          <NavLink to="/objects" className="text-gray-600 hover:text-gray-900">Objects</NavLink>
        </nav>

        {/* Secondary Navigation */}
        <div className="hidden md:flex items-center space-x-6 text-sm">
          <NavLink to="/login" className="text-gray-600 hover:text-gray-900">Login</NavLink>
          <NavLink to="/register" className="text-gray-600 hover:text-gray-900">Register</NavLink>
          <NavLink to="/contact" className="text-gray-600 hover:text-gray-900">Contact us</NavLink>
        </div>

        {/* Mobile Menu Button (Optional) */}
        <div className="md:hidden">
          <button className="text-gray-800 focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
