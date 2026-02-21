"use client";

import React from "react";
import { useAuth } from "@/components/AuthProvider";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
      <div className="flex items-center justify-between px-6 lg:px-8 py-4">
        {/* Left: Title */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Right: Actions + Avatar */}
        <div className="flex items-center space-x-3">

          {/* Divider */}
          <div className="h-8 w-px bg-gray-200 hidden sm:block" />

          {/* User */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 leading-tight">{user.name}</p>
              <p className="text-xs text-gray-400">
                {user.role === "STUDENT" ? "Student" : user.role.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </p>
            </div>
            <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
