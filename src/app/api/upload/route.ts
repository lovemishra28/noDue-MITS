import { NextResponse, NextRequest } from "next/server";
import { createSupabaseServerClient, getSessionWithPrisma } from "@/lib/supabase/server";

/**
 * POST /api/upload
 * Accepts a multipart form upload (field name: "file", plus "category" text field).
 * Uploads to Supabase Storage bucket "noDue Documents" under a path like:
 *   noDue Documents/{userId}/{category}/{timestamp}_{originalName}
 * Returns the public URL of the uploaded file.
 */
export async function POST(request: NextRequest) {
  try {
    // --- Auth check ---
    const user = await getSessionWithPrisma();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as string | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category is required (e.g., marksheet, bankDetails, collegeId, feeReceipts)" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size must be under 10MB" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only PDF, JPEG, PNG, and WebP files are allowed" },
        { status: 400 }
      );
    }

    // Build storage path
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/${category}/${timestamp}_${sanitizedName}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    // Use Supabase client with user's Supabase auth session
    const supabase = await createSupabaseServerClient();
    const { error: uploadError } = await supabase.storage
      .from("noDue Documents")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("noDue Documents")
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      data: {
        url: urlData.publicUrl,
        path: storagePath,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        category,
      },
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
