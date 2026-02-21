"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getRoleName } from "@/lib/auth";

export default function Navbar() {
  const { user, logout, loading } = useAuth();

  if (loading || !user) return null;

  const isStudent = user.role === "STUDENT";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href={isStudent ? "/dashboard" : `/dashboard/staff/${user.role.toLowerCase()}`} className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ND</span>
            </div>
            <span className="text-lg font-bold text-gray-900">noDue-MITS</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {isStudent ? (
              <>
                <Link href="/dashboard" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                  Dashboard
                </Link>
                <Link href="/apply" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                  Apply
                </Link>
                <Link href="/track" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                  Track Status
                </Link>
                <Link href="/certificate" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                  Certificate
                </Link>
              </>
            ) : (
              <Link
                href={`/dashboard/staff/${user.role.toLowerCase()}`}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{getRoleName(user.role)}</p>
            </div>
            <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isStudent && (
        <div className="md:hidden border-t border-gray-100 px-4 py-2 flex space-x-2 overflow-x-auto">
          <Link href="/dashboard" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-50 whitespace-nowrap">
            Dashboard
          </Link>
          <Link href="/apply" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-50 whitespace-nowrap">
            Apply
          </Link>
          <Link href="/track" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-50 whitespace-nowrap">
            Track
          </Link>
          <Link href="/certificate" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-50 whitespace-nowrap">
            Certificate
          </Link>
        </div>
      )}
    </nav>
  );
}
