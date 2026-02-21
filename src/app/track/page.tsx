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
  currentStage: number;
  approvals: Approval[];
  completionPercentage: number;
}

export default function TrackStatus() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
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
      console.error("Failed to fetch:", err);
    } finally {
      setFetching(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Application Status" subtitle="Track your no dues progress" />
        <div className="p-6 lg:p-8 flex items-center justify-center min-h-[70vh]">
          <div className="bg-white rounded-2xl border border-gray-200/60 p-12 shadow-sm max-w-lg w-full text-center">
            <div className="mx-auto h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
              <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">No Active Application</h3>
            <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
              You haven&apos;t submitted a no dues application yet. Start your application to track its progress here.
            </p>
            <Link href="/apply" className="mt-6 inline-block px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-sm">
              Apply Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const approvedCount = application.approvals.filter((a) => a.status === "APPROVED").length;
  const totalDepts = application.approvals.length;

  const getOverallStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return { label: "In Progress", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
      case "FULLY_APPROVED":
        return { label: "Approved", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
      case "REJECTED":
        return { label: "Rejected", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" };
      default:
        return { label: "In Progress", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
    }
  };

  const overallBadge = getOverallStatusBadge(application.status);

  return (
    <div className="min-h-screen">
      <PageHeader title="Application Status" subtitle="Track your no dues progress" />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Application Summary Card */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Application {application.applicationNo}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Submitted on{" "}
                {new Date(application.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <span className={`mt-3 sm:mt-0 inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ${overallBadge.bg} ${overallBadge.text} border ${overallBadge.border}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current mr-2" />
              {overallBadge.label}
            </span>
          </div>

          <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
            <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
            </svg>
            <span>
              <span className="font-semibold text-gray-900">{approvedCount}</span> of{" "}
              <span className="font-semibold text-gray-900">{totalDepts}</span> departments cleared
            </span>
          </div>

          <div className="mt-3 bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-600 rounded-full h-2 transition-all duration-700"
              style={{ width: `${application.completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Rejection Banner */}
        {application.status === "REJECTED" && (() => {
          const rejectedApproval = application.approvals.find((a) => a.status === "REJECTED");
          return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <div className="flex items-start space-x-3">
                <div className="h-9 w-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-red-800">Application Rejected</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Rejected at <strong>{rejectedApproval?.department || "a department"}</strong> (Stage {rejectedApproval?.stage}).
                    {rejectedApproval?.remarks && (
                      <> Reason: &quot;{rejectedApproval.remarks}&quot;</>
                    )}
                  </p>
                  <p className="text-xs text-red-500 mt-2">Contact the department for clarification or submit a new application.</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Approval Timeline */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">Approval Timeline</h3>
          </div>

          <div className="p-6">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4.25 top-0 bottom-0 w-0.5 bg-gray-200" />

              <div className="space-y-4">
                {(() => {
                  const rejectedIndex = application.approvals.findIndex((a) => a.status === "REJECTED");
                  const isRejected = application.status === "REJECTED";

                  return application.approvals.map((approval, index) => {
                    const isAfterRejection = isRejected && rejectedIndex !== -1 && index > rejectedIndex;
                    const isPending = approval.status === "UNDER_REVIEW" && index > 0 &&
                      application.approvals[index - 1]?.status !== "APPROVED" && !isAfterRejection;

                    const statusConfig = {
                      UNDER_REVIEW: {
                        label: isAfterRejection ? "Stopped" : (isPending ? "Pending" : "Under Review"),
                        bg: isAfterRejection ? "bg-gray-100" : "bg-amber-50",
                        text: isAfterRejection ? "text-gray-500" : "text-amber-700",
                        dot: isAfterRejection ? "bg-gray-300 ring-gray-100" : "bg-amber-400 ring-amber-100",
                      },
                      APPROVED: {
                        label: "Approved",
                        bg: "bg-emerald-50",
                        text: "text-emerald-700",
                        dot: "bg-emerald-500 ring-emerald-100",
                      },
                      REJECTED: {
                        label: "Rejected",
                        bg: "bg-red-50",
                        text: "text-red-700",
                        dot: "bg-red-500 ring-red-100",
                      },
                    };
                    const config = statusConfig[approval.status];

                    return (
                      <div key={approval.id} className={`relative flex items-start pl-12 ${isAfterRejection ? "opacity-40" : ""}`}>
                        {/* Timeline dot */}
                        <div className={`absolute left-2 top-4 h-4 w-4 rounded-full ${config.dot} ring-4 flex items-center justify-center`}>
                          {approval.status === "APPROVED" && (
                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {approval.status === "REJECTED" && (
                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>

                        {/* Card */}
                        <div className={`flex-1 rounded-xl border p-4 transition-all ${
                          isAfterRejection
                            ? "bg-gray-50/80 border-gray-200"
                            : approval.status === "REJECTED"
                            ? "bg-red-50 border-red-200"
                            : "bg-white border-gray-200/80 hover:shadow-md hover:border-gray-300"
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className={`font-semibold text-sm ${isAfterRejection ? "text-gray-400" : "text-gray-900"}`}>
                                {approval.department}
                              </h4>
                              <p className={`text-xs mt-0.5 ${isAfterRejection ? "text-gray-400" : "text-gray-400"}`}>
                                Stage {approval.stage}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                              {config.label}
                            </span>
                          </div>
                          {approval.actionDate && (
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(approval.actionDate).toLocaleDateString("en-IN", {
                                year: "numeric", month: "short", day: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </p>
                          )}
                          {approval.remarks && (
                            <p className={`text-xs mt-2 p-2 rounded-lg ${
                              approval.status === "REJECTED" ? "text-red-700 bg-red-100/60" : "text-gray-600 bg-gray-50"
                            }`}>
                              <strong>Remarks:</strong> {approval.remarks}
                            </p>
                          )}
                          {isAfterRejection && (
                            <p className="text-xs text-gray-400 mt-2 italic">
                              Skipped — application was rejected at an earlier stage.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}