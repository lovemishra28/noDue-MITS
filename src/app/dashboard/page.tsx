"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import PageHeader from "@/components/PageHeader";
import Link from "next/link";

interface Approval {
  id: string;
  stage: number;
  department: string;
  status: "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  actionDate: string | null;
  remarks: string | null;
}

interface Application {
  id: string;
  applicationNo: string;
  status: string;
  createdAt: string;
  approvals: Approval[];
  completionPercentage: number;
}

export default function StudentDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (!loading && user && user.role !== "STUDENT") {
      router.push(`/dashboard/staff/${user.role.toLowerCase()}`);
      return;
    }
    if (user?.id) {
      fetchApplication();
    }
  }, [user, loading]);

  const fetchApplication = async () => {
    try {
      const res = await fetch(`/api/applications?studentId=${user!.id}`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setApplication(data.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch application:", err);
    } finally {
      setFetching(false);
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

  const approvedCount =
    application?.approvals.filter((a) => a.status === "APPROVED").length || 0;
  const totalDepts = application?.approvals.length || 0;
  const completion = application?.completionPercentage || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return { label: "Submitted", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
      case "IN_PROGRESS":
        return { label: "In Progress", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
      case "FULLY_APPROVED":
        return { label: "Fully Approved", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
      case "REJECTED":
        return { label: "Rejected", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" };
      default:
        return { label: "Not Applied", bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
    }
  };

  const statusBadge = application ? getStatusBadge(application.status) : getStatusBadge("");

  return (
    <div className="min-h-screen">
      <PageHeader title="Dashboard" subtitle="Welcome back, track your clearance progress" />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="bg-linear-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome, {user?.name}!
                </h1>
                <p className="text-blue-100 mt-1 text-sm">
                  Enrollment: {user?.enrollmentNo || "N/A"} &bull; {user?.department || ""}
                </p>
                <span className={`inline-flex items-center mt-3 px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current mr-2" />
                  {statusBadge.label}
                </span>
              </div>

              {/* Completion Ring */}
              <div className="mt-6 lg:mt-0 flex items-center space-x-4">
                <div className="relative h-24 w-24">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-white/20"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="currentColor" strokeWidth="3"
                    />
                    <path
                      className="text-white"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="currentColor" strokeWidth="3"
                      strokeDasharray={`${completion}, 100`} strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{completion}%</span>
                  </div>
                </div>
                <div className="text-sm text-blue-100 font-medium">
                  Clearance<br />Progress
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rejection Banner */}
        {application?.status === "REJECTED" && (() => {
          const rejectedApproval = application.approvals.find((a) => a.status === "REJECTED");
          return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <div className="flex items-start space-x-4">
                <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-red-800">Application Rejected</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Rejected by <strong>{rejectedApproval?.department || "a department"}</strong> (Stage {rejectedApproval?.stage}).
                  </p>
                  {rejectedApproval?.remarks && (
                    <div className="mt-2 bg-red-100/60 rounded-lg p-3">
                      <p className="text-sm text-red-800"><strong>Reason:</strong> {rejectedApproval.remarks}</p>
                    </div>
                  )}
                  <p className="text-xs text-red-500 mt-2">Contact the department for clarification.</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href={application ? `/track` : `/apply`}
            className="bg-white rounded-2xl border border-gray-200/60 p-5 hover:shadow-md hover:border-blue-200 transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{application ? "View Application" : "Apply Now"}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{application ? `Ref: ${application.applicationNo}` : "Start your No-Dues application"}</p>
              </div>
            </div>
          </Link>

          <Link
            href="/track"
            className="bg-white rounded-2xl border border-gray-200/60 p-5 hover:shadow-md hover:border-indigo-200 transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Track Status</h3>
                <p className="text-xs text-gray-500 mt-0.5">Department-wise progress</p>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-2xl border border-gray-200/60 p-5">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Cleared</h3>
                <p className="text-xs text-gray-500 mt-0.5">{approvedCount} of {totalDepts} departments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Department Approvals */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Department Approvals</h2>
            <p className="text-sm text-gray-400 mt-0.5">Real-time approval status from all departments</p>
          </div>

          {application ? (
            <div className="divide-y divide-gray-100/80">
              {(() => {
                const rejectedIndex = application.approvals.findIndex((a) => a.status === "REJECTED");
                const isRejected = application.status === "REJECTED";
                return application.approvals.map((approval, index) => {
                  const isAfterRejection = isRejected && rejectedIndex !== -1 && index > rejectedIndex;
                  const statusConfig = {
                    UNDER_REVIEW: {
                      label: isAfterRejection ? "Stopped" : "Under Review",
                      bg: isAfterRejection ? "bg-gray-100" : "bg-amber-50",
                      text: isAfterRejection ? "text-gray-500" : "text-amber-700",
                      dot: isAfterRejection ? "bg-gray-300" : "bg-amber-400",
                    },
                    APPROVED: { label: "Approved", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
                    REJECTED: { label: "Rejected", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
                  };
                  const config = statusConfig[approval.status];
                  return (
                    <div key={approval.id} className={`flex items-center justify-between px-6 py-4 transition-colors ${isAfterRejection ? "opacity-40" : "hover:bg-gray-50/80"}`}>
                      <div className="flex items-center space-x-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
                        <div>
                          <p className={`font-medium text-sm ${isAfterRejection ? "text-gray-400" : "text-gray-900"}`}>{approval.department}</p>
                          <p className="text-xs text-gray-400">Stage {approval.stage}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>{config.label}</span>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="mx-auto h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-gray-700 font-semibold">No Application Yet</h3>
              <p className="text-gray-400 text-sm mt-1">Submit your No-Dues application to start tracking.</p>
              <Link href="/apply" className="mt-4 inline-block px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                Apply Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
