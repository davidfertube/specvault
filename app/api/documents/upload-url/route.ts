import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { MAX_PDF_SIZE } from "@/lib/validation";
import { handleApiError, createValidationError, getErrorStatusCode } from "@/lib/errors";

/**
 * Document Upload URL Generation API Route
 *
 * This endpoint generates pre-signed upload URLs for client-side uploads.
 * This bypasses Vercel's 4.5MB serverless function body size limit.
 *
 * Flow:
 * 1. Client requests signed URL with file metadata
 * 2. Server validates metadata and creates database record
 * 3. Server generates signed URL from Supabase Storage
 * 4. Client uploads directly to Supabase using signed URL
 * 5. Client calls /api/documents/upload to confirm completion
 *
 * Security:
 * - Signed URLs expire after 5 minutes
 * - File size validation before URL generation
 * - Filename sanitization prevents path traversal
 * - Database record created with 'uploading' status for audit trail
 */

interface UploadUrlRequest {
  filename: string;
  fileSize: number;
  contentType: string;
}

export async function POST(request: NextRequest) {
  try {
    // ========================================
    // Step 1: Parse and Validate Request Body
    // ========================================
    let body: UploadUrlRequest;

    try {
      body = await request.json();
    } catch {
      const error = createValidationError("Invalid request body. Expected JSON.");
      return NextResponse.json(error, { status: getErrorStatusCode("VALIDATION_ERROR") });
    }

    const { filename, fileSize, contentType } = body;

    // Validate required fields
    if (!filename || typeof filename !== "string") {
      const error = createValidationError("Missing or invalid filename.");
      return NextResponse.json(error, { status: getErrorStatusCode("VALIDATION_ERROR") });
    }

    if (!fileSize || typeof fileSize !== "number" || fileSize <= 0) {
      const error = createValidationError("Missing or invalid file size.");
      return NextResponse.json(error, { status: getErrorStatusCode("VALIDATION_ERROR") });
    }

    if (!contentType || contentType !== "application/pdf") {
      const error = createValidationError("Only PDF files are allowed.");
      return NextResponse.json(error, { status: getErrorStatusCode("VALIDATION_ERROR") });
    }

    // ========================================
    // Step 2: Validate File Size
    // ========================================
    if (fileSize > MAX_PDF_SIZE) {
      const sizeMB = (fileSize / (1024 * 1024)).toFixed(1);
      const maxMB = (MAX_PDF_SIZE / (1024 * 1024)).toFixed(0);
      const error = createValidationError(
        `File too large (${sizeMB}MB). Maximum allowed size is ${maxMB}MB.`
      );
      return NextResponse.json(error, { status: getErrorStatusCode("VALIDATION_ERROR") });
    }

    // ========================================
    // Step 3: Generate Safe Filename
    // ========================================
    // Use timestamp + sanitized filename to prevent collisions and path traversal
    const timestamp = Date.now();
    // Sanitize filename: keep only alphanumeric, dots, and hyphens
    const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${timestamp}-${sanitizedName}`;

    // ========================================
    // Step 4: Create Database Record
    // ========================================
    // Create record with 'uploading' status BEFORE generating signed URL
    // This ensures we have an audit trail even if upload fails
    const { data: docData, error: docError } = await supabase
      .from("documents")
      .insert({
        filename: filename, // Store original filename for display
        storage_path: storagePath,
        file_size: fileSize,
        status: "uploading", // Will be updated to "pending" after upload confirmation
      })
      .select("id")
      .single();

    if (docError) {
      console.error("[Upload URL API] Database insert error:", docError);
      const { response, status } = handleApiError(docError, "Upload URL Generation - Database");
      return NextResponse.json(response, { status });
    }

    // ========================================
    // Step 5: Generate Signed Upload URL
    // ========================================
    // Supabase signed upload URL allows client to upload directly
    // Token expires after 5 minutes (300 seconds)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("documents")
      .createSignedUploadUrl(storagePath);

    if (signedUrlError) {
      console.error("[Upload URL API] Signed URL generation error:", signedUrlError);

      // Clean up the database record since we couldn't generate URL
      try {
        await supabase.from("documents").delete().eq("id", docData.id);
      } catch (cleanupError) {
        console.error("[Upload URL API] Failed to clean up database record:", cleanupError);
      }

      const { response, status } = handleApiError(
        signedUrlError,
        "Upload URL Generation - Signed URL"
      );
      return NextResponse.json(response, { status });
    }

    // ========================================
    // Step 6: Return Success Response
    // ========================================
    return NextResponse.json({
      success: true,
      documentId: docData.id,
      uploadUrl: signedUrlData.signedUrl,
      path: storagePath,
      token: signedUrlData.token,
    });

  } catch (error) {
    // Use safe error handler - never leaks internal details
    const { response, status } = handleApiError(error, "Upload URL Generation");
    return NextResponse.json(response, { status });
  }
}
