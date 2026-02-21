"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getRoleName } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";

// Map every role to its department name (used in the approval records) and stage number
const ROLE_TO_DEPT: Record<string, { department: string; stage: number }> = {
  faculty: { department: "Faculty", stage: 1 },
  class_coordinator: { department: "Class Coordinator", stage: 2 },
  hod: { department: "HOD", stage: 3 },
  hostel_warden: { department: "Hostel Warden", stage: 4 },
  library_admin: { department: "Library", stage: 5 },
  workshop_admin: { department: "Workshop / Lab", stage: 6 },
  tp_officer: { department: "Training & Placement Cell", stage: 7 },
  general_office: { department: "General Office", stage: 8 },
  accounts_officer: { department: "Accounts Office", stage: 9 },
};

interface ApprovalItem {
  id: string;
  department: string;
  stage: number;
  status: string;
  application: {
    id: string;
    applicationNo: string;
    fullName: string;
    course: string;
    createdAt: string;
    currentStage: number;
  };
}

export default function StaffDashboard({ params }: { params: Promise<{ role: string }> }) {
  const { role } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  const deptInfo = ROLE_TO_DEPT[role];
  const roleName = getRoleName(role.toUpperCase());

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (!loading && user && user.role === "STUDENT") {
      router.push("/dashboard");
      return;
    }
    if (deptInfo) {
      fetchPendingApprovals();
    }
  }, [user, loading, role]);

  const fetchPendingApprovals = async () => {
    try {
      const res = await fetch(
        `/api/applications?department=${encodeURIComponent(deptInfo.department)}&stage=${deptInfo.stage}`
      );
      const data = await res.json();
      if (data.success) {
        setApprovals(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleAction = async (approvalId: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(approvalId);
    try {
      const res = await fetch("/api/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalId,
          status,
          remarks: remarks[approvalId] || null,
          approvedBy: user?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
        if (status === "APPROVED") setApprovedCount((prev) => prev + 1);
        else setRejectedCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-10 w-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Super Admin view
  if (role === "super_admin") {
    return (
      <div className="min-h-screen">
        <PageHeader title="Super Admin Panel" subtitle="System administration and monitoring" />
        <div className="p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm">
              <p className="text-sm text-gray-400 font-medium">Total Users</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">&mdash;</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm">
              <p className="text-sm text-gray-400 font-medium">Active Applications</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">&mdash;</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm">
              <p className="text-sm text-gray-400 font-medium">Certificates Issued</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">&mdash;</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200/60 p-8 text-center text-gray-400 shadow-sm">
            <p>Super Admin management views coming soon.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader title={`${roleName} Portal`} subtitle={`${deptInfo?.department} — Stage ${deptInfo?.stage} clearance`} />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/60 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{approvals.length}</p>
                <p className="text-xs text-gray-400 font-medium">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200/60 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
                <p className="text-xs text-gray-400 font-medium">Approved</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200/60 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
                <p className="text-xs text-gray-400 font-medium">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        {approvals.length === 0 ? (
          <div className="bg-white border border-gray-200/60 rounded-2xl p-12 text-center shadow-sm">
            <div className="mx-auto h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">All Clear!</h3>
            <p className="text-gray-400 text-sm mt-1">No pending approval requests at the moment.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Pending Requests</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Application</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/80">
                  {approvals.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-sm text-gray-900">{item.application.fullName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded">{item.application.applicationNo}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.application.course}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(item.application.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          placeholder="Optional remarks"
                          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full max-w-48 bg-gray-50 focus:bg-white transition-colors"
                          value={remarks[item.id] || ""}
                          onChange={(e) =>
                            setRemarks((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAction(item.id, "APPROVED")}
                            disabled={actionLoading === item.id}
                            className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            {actionLoading === item.id ? "..." : "Approve"}
                          </button>
                          <button
                            onClick={() => handleAction(item.id, "REJECTED")}
                            disabled={actionLoading === item.id}
                            className="border border-red-200 text-red-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}