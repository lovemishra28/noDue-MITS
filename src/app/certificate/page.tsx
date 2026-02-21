"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import PageHeader from "@/components/PageHeader";
import Link from "next/link";

interface Application {
  id: string;
  applicationNo: string;
  status: string;
  fullName: string;
  course: string;
  createdAt: string;
  updatedAt: string;
  completionPercentage: number;
}

export default function CertificateSection() {
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
      console.error("Failed to fetch application:", err);
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

  const isFullyApproved = application?.status === "FULLY_APPROVED";

  return (
    <div className="min-h-screen">
      <PageHeader title="Certificate" subtitle="View and download your no dues certificate" />

      <div className="p-6 lg:p-8">
        {isFullyApproved && application ? (
          /* Issued Certificate View */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-sm overflow-hidden relative">
              {/* Issued badge */}
              <div className="absolute top-4 right-4 z-10">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm">
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  ISSUED
                </span>
              </div>

              <div className="bg-linear-to-r from-emerald-50 to-teal-50 p-8">
                <div className="flex items-center space-x-5">
                  <div className="h-16 w-16 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                    <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">No Dues Certificate</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      Ref: {application.applicationNo}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Issued on{" "}
                      {new Date(application.updatedAt).toLocaleDateString("en-IN", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                      {" "}&bull;{" "}{application.fullName} &mdash; {application.course}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 flex space-x-3">
                <button className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-sm">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download PDF</span>
                </button>
                <button className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Preview</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* No Certificate Available */
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white rounded-2xl border border-gray-200/60 p-12 shadow-sm max-w-lg w-full text-center">
              <div className="mx-auto h-20 w-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">No Certificate Available</h3>
              <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
                {application
                  ? `Your application is ${application.status === "REJECTED" ? "rejected" : "still in progress"}. Complete all department approvals to receive your certificate.`
                  : "Submit your No-Dues application to begin the approval process."}
              </p>
              <div className="mt-6">
                {application ? (
                  <Link href="/track" className="inline-flex items-center text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors">
                    View Approval Progress
                    <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <Link href="/apply" className="inline-block px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-sm">
                    Apply Now
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}