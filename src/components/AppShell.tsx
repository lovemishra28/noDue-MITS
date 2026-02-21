"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Don't show sidebar on login page or when not authenticated
  const showSidebar = !loading && user && pathname !== "/login" && pathname !== "/";

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Mobile Hamburger Button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg"
        onClick={() => setMobileOpen(true)}
      >
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Main Content */}
      <main
        className={`flex-1 min-h-screen transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? "lg:ml-18" : "lg:ml-64"}
        `}
      >
        {children}
      </main>
    </div>
  );
}
