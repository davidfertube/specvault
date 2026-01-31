import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { MAX_PDF_SIZE } from "@/lib/validation";
import { handleApiError, createValidationError, getErrorStatusCode } from "@/lib/errors";

/**
 * Document Upload Confirmation API Route
 *
 * This endpoint confirms that a client-side upload to Supabase Storage
 * was completed successfully. It validates the uploaded file and updates
 * the database record from 'uploading' to 'pending' status.
 *
 * This approach bypasses Vercel's 4.5MB serverless function body size limit
 * by having clients upload directly to Supabase Storage using signed URLs.
 *
 * Flow:
 * 1. Client requests signed URL from /api/documents/upload-url
 * 2. Client uploads file directly to Supabase using signed URL
 * 3. Client calls THIS endpoint to confirm upload completion
 * 4. Server validates file exists and is a valid PDF
 * 5. Server updates database status to 'pending'
 *
 * Security features:
 * - Verifies file exists in storage before confirming
 * - PDF magic byte validation (prevents non-PDFs disguised as PDFs)
 * - Validates document record status is 'uploading'
 * - Updates file size from actual storage (not client-reported)
 * - Safe error handling (no internal details leaked)
 */

interface UploadConfirmRequest {
  documentId: number;  // Supabase BIGSERIAL returns number
  path: string;
}

export async function POST(request: NextRequest) {
  try {
    // ========================================
    // Step 1: Parse and Validate Request Body
    // ========================================
    let body: UploadConfirmRequest;

    try {
      body = await request.json();
    } catch {
      const error = createValidationError("Invalid request body. Expected JSON.");
      return NextResponse.json(error, { status: getErrorStatusCode("VALIDATION_ERROR") });
    }

    const { documentId, path } = body;

    if (!documentId || typeof documentId !== "number") {
      const error = createValidationError("Missing or invalid documentId.");
      return NextResponse.json(error, { status: getErrorStatusCode("VALIDATION_ERROR") });
    }

    if (!path || typeof path !== "string") {
      const error = createValidationError("Missing or invalid path.");
      return NextResponse.json(error, { status: getErrorStatusCode("VALIDATION_ERROR") });
    }

    // ========================================
    // Step 2: Verify Database Record Exists
    // ========================================
    const { data: docData, error: docError } = await supabase
      .from("documents")
      .select("id, status, filename, storage_path")
      .eq("id", documentId)
      .single();

    if (docError || !docData) {
      console.error("[Upload Confirm API] Document not found:", docError);
      const error = createValidationError("Document record not found.");
      return NextResponse.json(error, { status: 404 });
    }

    // Verify document is in 'uploading' status
    if (docData.status !== "uploading") {
      const error = createValidationError(
        `Document status is '${docData.status}', expected 'uploading'.`
      );
      return NextResponse.json(error, { status: getErrorStatusCode("VALIDATION_ERROR") });
    }

    // ========================================
    // Step 3: Verify File Exists in Storage
    // ========================================
    const { data: fileList, error: listError } = await supabase.storage
      .from("documents")
      .list("", {
        search: path,
      });

    if (listError || !fileList || fileList.length === 0) {
      console.error("[Upload Confirm API] File not found in storage:", listError);

      // Clean up orphaned database record
      try {
        await supabase.from("documents").delete().eq("id", documentId);
      } catch (cleanupError) {
        console.error("[Upload Confirm API] Failed to clean up orphaned record:", cleanupError);
      }

      const error = createValidationError("File not found in storage. Upload may have failed.");
      return NextResponse.json(error, { status: 404 });
    }

    // Get actual file size from storage
    const actualFileSize = fileList[0].metadata?.size || 0;

    // ========================================
    // Step 4: Download File for PDF Validation
    // ========================================
    // This is a security check - verify the file is actually a PDF
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(path);

    if (downloadError || !fileData) {
      console.error("[Upload Confirm API] Failed to download file for validation:", downloadError);
      const error = createValidationError("Failed to validate uploaded file.");
      return NextResponse.json(error, { status: getErrorStatusCode("VALIDATION_ERROR") });
    }

    // Read first 5 bytes to check PDF magic bytes
    const buffer = await fileData.slice(0, 5).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46 0x2D)
    const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2D];
    const isPdf = PDF_MAGIC.every((byte, index) => bytes[index] === byte);

    if (!isPdf) {
      console.error("[Upload Confirm API] Invalid PDF magic bytes");

      // Clean up invalid file
      try {
        await supabase.storage.from("documents").remove([path]);
        await supabase.from("documents").delete().eq("id", documentId);
      } catch (cleanupError) {
        console.error("[Upload Confirm API] Failed to clean up invalid file:", cleanupError);
      }

      const error = createValidationError(
        "Invalid PDF file. The uploaded file does not appear to be a valid PDF document."
      );
      return NextResponse.json(error, { status: getErrorStatusCode("VALIDATION_ERROR") });
    }

    // ========================================
    // Step 5: Validate File Size
    // ========================================
    if (actualFileSize > MAX_PDF_SIZE) {
      const sizeMB = (actualFileSize / (1024 * 1024)).toFixed(1);
      const maxMB = (MAX_PDF_SIZE / (1024 * 1024)).toFixed(0);

      // Clean up file that exceeds size limit
      try {
        await supabase.storage.from("documents").remove([path]);
        await supabase.from("documents").delete().eq("id", documentId);
      } catch (cleanupError) {
        console.error("[Upload Confirm API] Failed to clean up oversized file:", cleanupError);
      }

      const error = createValidationError(
        `File too large (${sizeMB}MB). Maximum allowed size is ${maxMB}MB.`
      );
      return NextResponse.json(error, { status: getErrorStatusCode("VALIDATION_ERROR") });
    }

    // ========================================
    // Step 6: Get Public URL
    // ========================================
    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(path);

    // ========================================
    // Step 7: Update Database Status
    // ========================================
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        status: "pending", // Will be updated to "indexed" after processing
        file_size: actualFileSize, // Use actual size from storage
      })
      .eq("id", documentId);

    if (updateError) {
      console.error("[Upload Confirm API] Failed to update document status:", updateError);
      const { response, status } = handleApiError(updateError, "Upload Confirmation - Database Update");
      return NextResponse.json(response, { status });
    }

    // ========================================
    // Step 8: Return Success Response
    // ========================================
    return NextResponse.json({
      success: true,
      documentId: documentId,
      path: path,
      url: urlData.publicUrl,
    });

  } catch (error) {
    // Use safe error handler - never leaks internal details
    const { response, status } = handleApiError(error, "Document Upload");
    return NextResponse.json(response, { status });
  }
}
