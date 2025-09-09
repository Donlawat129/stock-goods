// src/components/dashboard/DashBoardNavbar.tsx
import type { JSX } from "react";
import { useState } from "react";
import { FiSearch, FiChevronDown, FiBell } from "react-icons/fi";

export type NavUser = {
  name: string;
  role?: string;
  avatarUrl?: string;
};

type Props = {
  lang?: string;
  onChangeLang?: (lang: string) => void;
  onSearch?: (q: string) => void;
  notifications?: number;
  user?: NavUser;
  rightExtra?: JSX.Element; // ไว้เผื่อปุ่มเสริม เช่น Create, Help
};

export default function DashBoardNavbar({
  lang = "Eng (US)",
  onChangeLang,
  onSearch,
  notifications = 0,
  user = { name: "Syndtechdev", role: "Admin", avatarUrl: "https://marketplace.canva.com/m3zhI/MAEWdFm3zhI/1/tl/canva-human-face.-MAEWdFm3zhI.png" },
  rightExtra,
}: Props) {
  const [q, setQ] = useState("");

  return (
    <header className="w-full bg-transparent">
      <div className="flex flex-col items-start justify-between space-y-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user.name}! Here's what's happening today.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch?.(q)}
              type="text"
              placeholder="Search here..."
              className="py-2 pl-10 pr-4 w-full md:w-64 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            <FiSearch
              onClick={() => onSearch?.(q)}
              className="absolute left-3 top-3 text-gray-400 cursor-pointer"
              title="Search"
            />
          </div>

          {/* Language */}
          <button
            className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200"
            onClick={() => onChangeLang?.(lang === "Eng (US)" ? "ไทย" : "Eng (US)")}
          >
            <span className="text-gray-600 text-sm">{lang}</span>
            <FiChevronDown className="text-gray-400" />
          </button>

          {/* Notifications */}
          <div className="relative p-2 rounded-lg bg-white border border-gray-200">
            <FiBell className="text-gray-600" />
            {!!notifications && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {notifications}
              </span>
            )}
          </div>

          {/* Extra action (optional) */}
          {rightExtra}

          {/* User */}
          <div className="flex items-center space-x-2">
            <img
              src={user.avatarUrl}
              alt="profile"
              className="w-10 h-10 rounded-full border-2 border-blue-300 object-cover"
            />
            <div className="hidden md:block text-sm">
              <p className="font-medium text-gray-800">{user.name}</p>
              <p className="text-blue-500">{user.role ?? "Member"}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
