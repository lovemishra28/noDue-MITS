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

// All roles that can be assigned by Super Admin
const ASSIGNABLE_ROLES = [
  { value: "STUDENT", label: "Student" },
  { value: "FACULTY", label: "Faculty" },
  { value: "CLASS_COORDINATOR", label: "Class Coordinator" },
  { value: "HOD", label: "Head of Department" },
  { value: "HOSTEL_WARDEN", label: "Hostel Warden" },
  { value: "LIBRARY_ADMIN", label: "Library Admin" },
  { value: "WORKSHOP_ADMIN", label: "Workshop Admin" },
  { value: "TP_OFFICER", label: "T&P Officer" },
  { value: "GENERAL_OFFICE", label: "General Office" },
  { value: "ACCOUNTS_OFFICER", label: "Accounts Officer" },
];

interface SearchedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  enrollmentNo: string | null;
  createdAt: string;
}

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

  // Super Admin state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [newRole, setNewRole] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [adminMessage, setAdminMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    const handleSearch = async () => {
      if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
      setSearching(true);
      setAdminMessage(null);
      try {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.data);
          if (data.data.length === 0) {
            setAdminMessage({ type: "error", text: "No users found matching your search." });
          }
        } else {
          setAdminMessage({ type: "error", text: data.error || "Search failed" });
        }
      } catch {
        setAdminMessage({ type: "error", text: "Failed to search users" });
      } finally {
        setSearching(false);
      }
    };

    const handleAssignRole = async () => {
      if (!selectedUser || !newRole) return;
      setAssigning(true);
      setAdminMessage(null);
      try {
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedUser.id,
            role: newRole,
            department: newDepartment || undefined,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setAdminMessage({ type: "success", text: data.message });
          // Update the search results inline
          setSearchResults((prev) =>
            prev.map((u) =>
              u.id === selectedUser.id
                ? { ...u, role: newRole, department: newDepartment || u.department }
                : u
            )
          );
          setSelectedUser(null);
          setNewRole("");
          setNewDepartment("");
        } else {
          setAdminMessage({ type: "error", text: data.error || "Failed to assign role" });
        }
      } catch {
        setAdminMessage({ type: "error", text: "Something went wrong" });
      } finally {
        setAssigning(false);
      }
    };

    return (
      <div className="min-h-screen">
        <PageHeader title="Super Admin Panel" subtitle="Manage user roles and system administration" />
        <div className="p-6 lg:p-8 space-y-6">

          {/* Status Message */}
          {adminMessage && (
            <div className={`p-4 rounded-xl text-sm font-medium border ${
              adminMessage.type === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {adminMessage.text}
            </div>
          )}

          {/* Search Section */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Search & Assign Roles</h3>
            <p className="text-sm text-gray-400 mb-5">
              Search for a user by email or name, then assign them a specific role.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all text-gray-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || searchQuery.trim().length < 2}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shrink-0"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">
                  Search Results ({searchResults.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/80 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Role</th>
                      <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/80">
                    {searchResults.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-sm text-gray-900">{u.name}</p>
                          {u.enrollmentNo && (
                            <p className="text-xs text-gray-400 mt-0.5">{u.enrollmentNo}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === "STUDENT"
                              ? "bg-blue-50 text-blue-700"
                              : u.role === "FACULTY"
                              ? "bg-indigo-50 text-indigo-700"
                              : "bg-amber-50 text-amber-700"
                          }`}>
                            {getRoleName(u.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{u.department || "—"}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setNewRole(u.role);
                              setNewDepartment(u.department || "");
                              setAdminMessage(null);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors"
                          >
                            Change Role
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Role Assignment Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Assign Role</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Change the role for <span className="font-semibold text-gray-700">{selectedUser.name}</span> ({selectedUser.email})
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Current Role
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200">
                      {getRoleName(selectedUser.role)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      New Role
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all text-gray-900 text-sm"
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Department (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CSE, ECE, ME..."
                      className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all text-gray-900 text-sm"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setNewRole("");
                      setNewDepartment("");
                    }}
                    className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignRole}
                    disabled={assigning || !newRole}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {assigning ? "Assigning..." : "Assign Role"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200/60 rounded-2xl p-6">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">How Role Assignment Works</h4>
            <ul className="text-sm text-blue-700 space-y-1.5 list-disc list-inside">
              <li>New users are automatically identified as <strong>Student</strong> or <strong>Faculty</strong> from their email.</li>
              <li>All other roles (HOD, Library Admin, etc.) must be assigned here by the Super Admin.</li>
              <li>Search for a user by email or name, then click &quot;Change Role&quot; to assign a new role.</li>
              <li>Role changes take effect on the user&apos;s next login.</li>
            </ul>
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