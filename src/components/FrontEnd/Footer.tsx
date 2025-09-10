import { Link } from "react-router-dom";

import React from "react";

import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaLine,
  FaTiktok,
} from "react-icons/fa";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-200 text-blue-900 py-12 mt-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center justify-center space-y-8">
          {/* Social Media Icons */}
          <div className="flex space-x-6">
            <Link
              to="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-600"
            >
              <FaFacebookF size={24} />
            </Link>
            <Link
              to="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-pink-500"
            >
              <FaInstagram size={24} />
            </Link>
            <Link
              to="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-red-500"
            >
              <FaYoutube size={24} />
            </Link>
            <Link
              to="https://line.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-green-500"
            >
              <FaLine size={24} />
            </Link>
            <Link
              to="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-black"
            >
              <FaTiktok size={24} />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center space-x-6 text-sm">
            <Link to="/men" className="hover:text-blue-700">
              Men
            </Link>
            <Link to="/women" className="hover:text-blue-700">
              Women
            </Link>
            <Link to="/objects" className="hover:text-blue-700">
            Objects
            </Link>
          </div>

          {/* Copyright Section */}
          <div className="text-xs text-blue-500 mt-8">
            <p>Copyright ©2025; Designed by Syndtechdev</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
