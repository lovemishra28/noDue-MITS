"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const INSTITUTE_DOMAIN = "mitsgwl.ac.in";

const DEPARTMENTS = [
  "CSE",
  "IT",
  "ECE",
  "EE",
  "ME",
  "CE",
  "CH",
  "MCA",
  "MBA",
  "PHY",
  "MATH",
  "HUM",
];

export default function VerifyInstituteEmailPage() {
  const [instituteEmail, setInstituteEmail] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side domain check
    const domain = instituteEmail.trim().split("@")[1]?.toLowerCase();
    if (domain !== INSTITUTE_DOMAIN) {
      setError(`Please enter a valid @${INSTITUTE_DOMAIN} email address.`);
      return;
    }

    if (!enrollmentNo.trim()) {
      setError("Enrollment number is required.");
      return;
    }

    if (!department) {
      setError("Please select your department.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-institute-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instituteEmail: instituteEmail.trim(),
          enrollmentNo: enrollmentNo.trim().toUpperCase(),
          department,
        }),
      });

      const data = await res.json();

      if (data.success) {
        login({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          enrollmentNo: data.user.enrollmentNo,
          department: data.user.department,
        });
        router.push(data.redirectPath);
      } else {
        setError(data.error || "Verification failed. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── Left Panel: College Branding (same as login) ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-blue-800 overflow-hidden">
        <img
          src="./assets/mits.png"
          alt="College campus"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-linear-to-br from-blue-900/80 via-blue-800/60 to-indigo-900/80" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <span className="text-white text-lg font-bold">ND</span>
              </div>
              <div>
                <h2 className="text-white text-xl font-bold">noDue-MITS</h2>
                <p className="text-blue-200 text-xs">Certificate Portal</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
              One more step&hellip;
            </h1>
            <p className="text-blue-200 text-lg max-w-md leading-relaxed">
              Provide your institute email, enrollment number, and department to
              verify your identity and link it with your Google account.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-blue-300 text-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Gwalior, Madhya Pradesh, India</span>
          </div>
        </div>
      </div>

      {/* ─── Right Panel: Institute Email Form ─── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-linear-to-br from-gray-50 via-white to-blue-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center h-14 w-14 bg-blue-600 rounded-2xl shadow-lg mb-3">
              <span className="text-white text-xl font-bold">ND</span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">noDue-MITS</h1>
            <p className="mt-1 text-gray-500 text-sm">No-Dues Certificate Portal</p>
          </div>

          <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100">
            {/* Info banner */}
            <div className="mb-6 flex items-start space-x-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <svg className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-700">
                Your Google account isn&apos;t an institute email. Please enter
                your <strong>@{INSTITUTE_DOMAIN}</strong> email to complete
                sign-in.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Complete Your Profile
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Link your Google account with your MITS institute details
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center border border-red-100 flex items-center justify-center space-x-2">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Institute Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all text-gray-900"
                    placeholder={`name@${INSTITUTE_DOMAIN}`}
                    value={instituteEmail}
                    onChange={(e) => setInstituteEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Enrollment Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all text-gray-900 uppercase"
                    placeholder="e.g. 0101CS221001"
                    value={enrollmentNo}
                    onChange={(e) => setEnrollmentNo(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Department
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <select
                    required
                    className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all text-gray-900 appearance-none"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="" disabled>Select your department</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  "Verify & Sign In"
                )}
              </button>
            </form>

            {/* Back to login link */}
            <div className="mt-6 text-center">
              <a
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                &larr; Back to Sign In
              </a>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            MITS Gwalior &mdash; No-Dues Certificate Portal
          </p>
        </div>
      </div>
    </div>
  );
}
