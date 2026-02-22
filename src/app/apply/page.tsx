"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import PageHeader from "@/components/PageHeader";

const STEPS = [
  "Personal Details",
  "Academic Details",
  "Hostel & Prerequisites",
  "Upload Documents",
  "Review & Submit",
];

interface FormData {
  fullName: string;
  email: string;
  fatherName: string;
  phoneNumber: string;
  address: string;
  enrollmentNo: string;
  department: string;
  passOutYear: string;
  course: string;
  cgpa: string;
  isHostelResident: boolean;
  hostelName: string;
  roomNumber: string;
  cautionMoneyRefund: boolean;
  receiptNumber: string;
  exitSurvey: boolean;
  feesCleared: boolean;
  projectCertSubmitted: boolean;
  feeReceipts: string;
  marksheet: string;
  bankDetails: string;
  collegeId: string;
  declaration: boolean;
}

export default function ApplyNoDues() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    fatherName: "",
    phoneNumber: "",
    address: "",
    enrollmentNo: "",
    department: "",
    passOutYear: "",
    course: "",
    cgpa: "",
    isHostelResident: false,
    hostelName: "",
    roomNumber: "",
    cautionMoneyRefund: false,
    receiptNumber: "",
    exitSurvey: false,
    feesCleared: false,
    projectCertSubmitted: false,
    feeReceipts: "",
    marksheet: "",
    bankDetails: "",
    collegeId: "",
    declaration: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name || "",
        email: user.email || "",
        enrollmentNo: user.enrollmentNo || "",
        department: user.department || "",
      }));
    }
  }, [user, loading]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [highestValidStep, setHighestValidStep] = useState(1);

  const update = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Per-stage validation — returns errors map (empty = valid)
  const validateStep = (stepNum: number): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (stepNum === 1) {
      if (!formData.fullName.trim()) errors.fullName = "Full Name is required";
      if (!formData.email.trim()) errors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        errors.email = "Enter a valid email address";
      if (!formData.fatherName.trim()) errors.fatherName = "Father's Name is required";
      if (!formData.phoneNumber.trim()) errors.phoneNumber = "Phone Number is required";
      else {
        const digits = formData.phoneNumber.replace(/[\s\-\+]/g, "");
        if (digits.length < 10 || !/^\d+$/.test(digits))
          errors.phoneNumber = "Enter a valid phone number (min 10 digits)";
      }
      if (!formData.address.trim()) errors.address = "Address is required";
    }

    if (stepNum === 2) {
      if (!formData.enrollmentNo.trim()) errors.enrollmentNo = "Enrollment Number is required";
      if (!formData.department) errors.department = "Department is required";
      if (!formData.passOutYear.trim()) errors.passOutYear = "Pass Out Year is required";
      else {
        const year = Number(formData.passOutYear);
        if (year < 2000 || year > 2100) errors.passOutYear = "Year must be between 2000 and 2100";
      }
      if (!formData.course) errors.course = "Course is required";
      if (!formData.cgpa.trim()) errors.cgpa = "CGPA is required";
      else {
        const cgpa = Number(formData.cgpa);
        if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) errors.cgpa = "CGPA must be between 0 and 10";
      }
    }

    if (stepNum === 3) {
      if (formData.isHostelResident) {
        if (!formData.hostelName.trim()) errors.hostelName = "Hostel Name is required";
        if (!formData.roomNumber.trim()) errors.roomNumber = "Room Number is required";
      }
      if (formData.cautionMoneyRefund) {
        if (!formData.receiptNumber.trim()) errors.receiptNumber = "Receipt Number is required";
      }
      if (!formData.exitSurvey) errors.exitSurvey = "Exit Survey must be completed";
      if (!formData.feesCleared) errors.feesCleared = "All fees must be cleared";
      if (!formData.projectCertSubmitted) errors.projectCertSubmitted = "Project/Internship certificate must be submitted";
    }

    // Stage 4 (documents) — URLs are optional, no hard validation
    // Stage 5 (review) — declaration checked at submit time

    return errors;
  };

  const nextStep = () => {
    const errors = validateStep(step);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return; // Block progression
    }
    setFieldErrors({});
    const next = Math.min(step + 1, 5);
    setStep(next);
    setHighestValidStep((prev) => Math.max(prev, next));
  };

  const prevStep = () => {
    setFieldErrors({});
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!formData.declaration) {
      setSubmitError("Please accept the declaration before submitting.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user?.id,
          fullName: formData.fullName,
          fatherName: formData.fatherName,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          passOutYear: formData.passOutYear,
          course: formData.course,
          cgpa: formData.cgpa,
          isHostelResident: formData.isHostelResident,
          hostelName: formData.hostelName || null,
          roomNumber: formData.roomNumber || null,
          cautionMoneyRefund: formData.cautionMoneyRefund,
          receiptNumber: formData.receiptNumber || null,
          feeReceipts: formData.feeReceipts ? [formData.feeReceipts] : [],
          marksheet: formData.marksheet || null,
          bankDetails: formData.bankDetails || null,
          collegeId: formData.collegeId || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(true);
      } else {
        setSubmitError(data.error || "Failed to submit application");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Apply for No Dues" subtitle="Submit your clearance application" />
        <div className="p-6 lg:p-8 flex items-center justify-center min-h-[70vh]">
          <div className="bg-white rounded-2xl border border-gray-200/60 p-12 shadow-sm max-w-lg w-full text-center">
            <div className="mx-auto h-20 w-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
              <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
            <p className="text-gray-500 mb-8">
              Your No-Dues application has been submitted. Track your approval progress from the dashboard.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push("/track")}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Track Status
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inputClasses =
    "block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all text-gray-900";
  const inputErrorClasses =
    "block w-full px-4 py-3 bg-red-50 border border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white outline-none transition-all text-gray-900";
  const labelClasses = "block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5";
  const errorTextClasses = "text-xs text-red-600 mt-1";

  // Update highest step whenever we successfully move forward
  const handleStepClick = (targetStep: number) => {
    if (targetStep <= highestValidStep) {
      // Can go back or to any previously validated step
      setFieldErrors({});
      setStep(targetStep);
    }
    // Can't jump forward past validated steps
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Apply for No Dues" subtitle="Submit your clearance application" />

      <div className="p-6 lg:p-8">
        {/* Progress Header */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="bg-linear-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 text-white">
            <h2 className="text-lg font-bold">Apply for No-Dues Certificate</h2>
            <p className="text-blue-100 text-sm mt-1">
              Stage {step} of 5 &mdash; {STEPS[step - 1]}
            </p>
            <div className="mt-4 bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>

        {/* Step Indicators */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {STEPS.map((label, i) => {
            const stepNum = i + 1;
            const isAccessible = stepNum <= highestValidStep;
            const isCurrent = step === stepNum;
            const isCompleted = stepNum < step;

            return (
              <button
                key={i}
                onClick={() => handleStepClick(stepNum)}
                disabled={!isAccessible}
                className={`flex-1 min-w-30 px-4 py-3 text-xs font-medium text-center transition-colors ${
                  isCurrent
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                    : isCompleted
                    ? "text-green-600 bg-green-50/30 cursor-pointer"
                    : isAccessible
                    ? "text-gray-600 cursor-pointer hover:bg-gray-50"
                    : "text-gray-300 cursor-not-allowed"
                }`}
              >
                <span className="block">
                  {isCompleted ? "✓" :  stepNum}
                </span>
                <span className="hidden sm:block mt-0.5">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-8">
          {/* Stage 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
                Personal Details
              </h3>
              {Object.keys(fieldErrors).length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  Please fill in all required fields before proceeding.
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClasses}>Full Name *</label>
                  <input
                    type="text"
                    required
                    className={fieldErrors.fullName ? inputErrorClasses : inputClasses}
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                  />
                  {fieldErrors.fullName && <p className={errorTextClasses}>{fieldErrors.fullName}</p>}
                </div>
                <div>
                  <label className={labelClasses}>Email *</label>
                  <input
                    type="email"
                    required
                    className={fieldErrors.email ? inputErrorClasses : inputClasses}
                    placeholder="name@mitsgwl.ac.in"
                    value={formData.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                  {fieldErrors.email && <p className={errorTextClasses}>{fieldErrors.email}</p>}
                </div>
                <div>
                  <label className={labelClasses}>Father&apos;s Name *</label>
                  <input
                    type="text"
                    required
                    className={fieldErrors.fatherName ? inputErrorClasses : inputClasses}
                    placeholder="Enter father's name"
                    value={formData.fatherName}
                    onChange={(e) => update("fatherName", e.target.value)}
                  />
                  {fieldErrors.fatherName && <p className={errorTextClasses}>{fieldErrors.fatherName}</p>}
                </div>
                <div>
                  <label className={labelClasses}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    className={fieldErrors.phoneNumber ? inputErrorClasses : inputClasses}
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phoneNumber}
                    onChange={(e) => update("phoneNumber", e.target.value)}
                  />
                  {fieldErrors.phoneNumber && <p className={errorTextClasses}>{fieldErrors.phoneNumber}</p>}
                </div>
              </div>
              <div>
                <label className={labelClasses}>Permanent Address *</label>
                <textarea
                  required
                  rows={3}
                  className={fieldErrors.address ? inputErrorClasses : inputClasses}
                  placeholder="Enter your permanent address"
                  value={formData.address}
                  onChange={(e) => update("address", e.target.value)}
                />
                {fieldErrors.address && <p className={errorTextClasses}>{fieldErrors.address}</p>}
              </div>
            </div>
          )}

          {/* Stage 2: Academic Details */}
          {step === 2 && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
                Academic Details
              </h3>
              {Object.keys(fieldErrors).length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  Please fill in all required fields before proceeding.
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClasses}>Enrollment Number *</label>
                  <input
                    type="text"
                    required
                    className={fieldErrors.enrollmentNo ? inputErrorClasses : inputClasses}
                    placeholder="0108XX221XXX"
                    value={formData.enrollmentNo}
                    onChange={(e) => update("enrollmentNo", e.target.value)}
                  />
                  {fieldErrors.enrollmentNo && <p className={errorTextClasses}>{fieldErrors.enrollmentNo}</p>}
                </div>
                <div>
                  <label className={labelClasses}>Department *</label>
                  <select
                    className={fieldErrors.department ? inputErrorClasses : inputClasses}
                    value={formData.department}
                    onChange={(e) => update("department", e.target.value)}
                  >
                    <option value="">Select Department</option>
                    <option value="CSE">Computer Science & Engineering</option>
                    <option value="IT">Information Technology</option>
                    <option value="ECE">Electronics & Communication</option>
                    <option value="EE">Electrical Engineering</option>
                    <option value="ME">Mechanical Engineering</option>
                    <option value="CE">Civil Engineering</option>
                  </select>
                  {fieldErrors.department && <p className={errorTextClasses}>{fieldErrors.department}</p>}
                </div>
                <div>
                  <label className={labelClasses}>Pass Out Year *</label>
                  <input
                    type="number"
                    required
                    className={fieldErrors.passOutYear ? inputErrorClasses : inputClasses}
                    placeholder="2026"
                    value={formData.passOutYear}
                    onChange={(e) => update("passOutYear", e.target.value)}
                  />
                  {fieldErrors.passOutYear && <p className={errorTextClasses}>{fieldErrors.passOutYear}</p>}
                </div>
                <div>
                  <label className={labelClasses}>Course *</label>
                  <select
                    className={fieldErrors.course ? inputErrorClasses : inputClasses}
                    value={formData.course}
                    onChange={(e) => update("course", e.target.value)}
                  >
                    <option value="">Select Course</option>
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="MBA">MBA</option>
                    <option value="MCA">MCA</option>
                    <option value="PhD">PhD</option>
                  </select>
                  {fieldErrors.course && <p className={errorTextClasses}>{fieldErrors.course}</p>}
                </div>
                <div>
                  <label className={labelClasses}>CGPA *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    className={fieldErrors.cgpa ? inputErrorClasses : inputClasses}
                    placeholder="8.50"
                    value={formData.cgpa}
                    onChange={(e) => update("cgpa", e.target.value)}
                  />
                  {fieldErrors.cgpa && <p className={errorTextClasses}>{fieldErrors.cgpa}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Stage 3: Hostel & Caution Money & Prerequisites */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
                Hostel & Prerequisites
              </h3>
              {Object.keys(fieldErrors).length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  Please complete all required items before proceeding.
                </div>
              )}

              {/* Hostel Resident */}
              <div className="bg-gray-50 p-5 rounded-xl space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="hostel"
                    className="h-5 w-5 text-blue-600 rounded"
                    checked={formData.isHostelResident}
                    onChange={(e) => update("isHostelResident", e.target.checked)}
                  />
                  <label htmlFor="hostel" className="text-gray-700 font-medium">
                    Are you a Hostel Resident?
                  </label>
                </div>
                {formData.isHostelResident && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pl-8">
                    <div>
                      <label className={labelClasses}>Hostel Name *</label>
                      <input
                        type="text"
                        className={fieldErrors.hostelName ? inputErrorClasses : inputClasses}
                        placeholder="Enter hostel name"
                        value={formData.hostelName}
                        onChange={(e) => update("hostelName", e.target.value)}
                      />
                      {fieldErrors.hostelName && <p className={errorTextClasses}>{fieldErrors.hostelName}</p>}
                    </div>
                    <div>
                      <label className={labelClasses}>Room Number *</label>
                      <input
                        type="text"
                        className={fieldErrors.roomNumber ? inputErrorClasses : inputClasses}
                        placeholder="Enter room number"
                        value={formData.roomNumber}
                        onChange={(e) => update("roomNumber", e.target.value)}
                      />
                      {fieldErrors.roomNumber && <p className={errorTextClasses}>{fieldErrors.roomNumber}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Caution Money */}
              <div className="bg-gray-50 p-5 rounded-xl space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="caution"
                    className="h-5 w-5 text-blue-600 rounded"
                    checked={formData.cautionMoneyRefund}
                    onChange={(e) => update("cautionMoneyRefund", e.target.checked)}
                  />
                  <label htmlFor="caution" className="text-gray-700 font-medium">
                    Caution Money Refund?
                  </label>
                </div>
                {formData.cautionMoneyRefund && (
                  <div className="pl-8 mt-3">
                    <label className={labelClasses}>Receipt Number *</label>
                    <input
                      type="text"
                      className={`${fieldErrors.receiptNumber ? inputErrorClasses : inputClasses} max-w-sm`}
                      placeholder="Enter receipt number"
                      value={formData.receiptNumber}
                      onChange={(e) => update("receiptNumber", e.target.value)}
                    />
                    {fieldErrors.receiptNumber && <p className={errorTextClasses}>{fieldErrors.receiptNumber}</p>}
                  </div>
                )}
              </div>

              {/* Mandatory Prerequisites */}
              <div className={`p-5 rounded-xl space-y-3 border ${
                fieldErrors.exitSurvey || fieldErrors.feesCleared || fieldErrors.projectCertSubmitted
                  ? "bg-red-50 border-red-200"
                  : "bg-blue-50 border-blue-200"
              }`}>
                <p className="text-sm font-semibold text-blue-800 mb-2">
                  Mandatory Prerequisites *
                </p>
                {(fieldErrors.exitSurvey || fieldErrors.feesCleared || fieldErrors.projectCertSubmitted) && (
                  <p className={errorTextClasses}>All prerequisites must be checked</p>
                )}
                <label className="flex items-center space-x-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 rounded"
                    checked={formData.exitSurvey}
                    onChange={(e) => update("exitSurvey", e.target.checked)}
                  />
                  <span>Exit Survey Completed ✔</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 rounded"
                    checked={formData.feesCleared}
                    onChange={(e) => update("feesCleared", e.target.checked)}
                  />
                  <span>All Fees Cleared ✔</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 rounded"
                    checked={formData.projectCertSubmitted}
                    onChange={(e) => update("projectCertSubmitted", e.target.checked)}
                  />
                  <span>Project/Internship Certificate Submitted ✔</span>
                </label>
              </div>
            </div>
          )}

          {/* Stage 4: Upload Documents */}
          {step === 4 && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
                Upload Documents
              </h3>
              <p className="text-sm text-gray-500">
                Provide URLs or references for the required documents. 
                (File upload integration can be added with cloud storage.)
              </p>
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className={labelClasses}>Fee Receipts (URL)</label>
                  <input
                    type="url"
                    className={inputClasses}
                    placeholder="https://drive.google.com/..."
                    value={formData.feeReceipts}
                    onChange={(e) => update("feeReceipts", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Previous Marksheet (URL)</label>
                  <input
                    type="url"
                    className={inputClasses}
                    placeholder="https://drive.google.com/..."
                    value={formData.marksheet}
                    onChange={(e) => update("marksheet", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Bank Passbook / Cancelled Cheque (URL)</label>
                  <input
                    type="url"
                    className={inputClasses}
                    placeholder="https://drive.google.com/..."
                    value={formData.bankDetails}
                    onChange={(e) => update("bankDetails", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClasses}>College ID Proof (URL)</label>
                  <input
                    type="url"
                    className={inputClasses}
                    placeholder="https://drive.google.com/..."
                    value={formData.collegeId}
                    onChange={(e) => update("collegeId", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stage 5: Review & Submit */}
          {step === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
                Review & Submit
              </h3>

              {/* Personal Details Review */}
              <div className="bg-gray-50 p-5 rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">
                  Personal Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900">{formData.fullName}</span></div>
                  <div><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-900">{formData.email}</span></div>
                  <div><span className="text-gray-500">Father:</span> <span className="font-medium text-gray-900">{formData.fatherName}</span></div>
                  <div><span className="text-gray-500">Phone:</span> <span className="font-medium text-gray-900">{formData.phoneNumber}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">Address:</span> <span className="font-medium text-gray-900">{formData.address}</span></div>
                </div>
              </div>

              {/* Academic Details Review */}
              <div className="bg-gray-50 p-5 rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">
                  Academic Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Enrollment:</span> <span className="font-medium text-gray-900">{formData.enrollmentNo}</span></div>
                  <div><span className="text-gray-500">Department:</span> <span className="font-medium text-gray-900">{formData.department}</span></div>
                  <div><span className="text-gray-500">Course:</span> <span className="font-medium text-gray-900">{formData.course}</span></div>
                  <div><span className="text-gray-500">Pass Out:</span> <span className="font-medium text-gray-900">{formData.passOutYear}</span></div>
                  <div><span className="text-gray-500">CGPA:</span> <span className="font-medium text-gray-900">{formData.cgpa}</span></div>
                </div>
              </div>

              {/* Hostel Review */}
              <div className="bg-gray-50 p-5 rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">
                  Hostel & Caution Money
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Hostel Resident:</span> <span className="font-medium text-gray-900">{formData.isHostelResident ? "Yes" : "No"}</span></div>
                  {formData.isHostelResident && (
                    <>
                      <div><span className="text-gray-500">Hostel:</span> <span className="font-medium text-gray-900">{formData.hostelName}</span></div>
                      <div><span className="text-gray-500">Room:</span> <span className="font-medium text-gray-900">{formData.roomNumber}</span></div>
                    </>
                  )}
                  <div><span className="text-gray-500">Caution Refund:</span> <span className="font-medium text-gray-900">{formData.cautionMoneyRefund ? "Yes" : "No"}</span></div>
                </div>
              </div>

              {/* Declaration */}
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 rounded mt-0.5"
                    checked={formData.declaration}
                    onChange={(e) => update("declaration", e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 leading-relaxed">
                    I hereby declare that all information provided is true and correct. 
                    I understand that providing false information may result in rejection 
                    of my application and disciplinary action.
                  </span>
                </label>
              </div>

              {submitError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center border border-red-100">
                  {submitError}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            {step < 5 ? (
              <button
                onClick={nextStep}
                className="ml-auto px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Next Stage
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.declaration}
                className="ml-auto px-8 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Application</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}