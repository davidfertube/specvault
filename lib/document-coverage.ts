/**
 * Document Coverage Check
 *
 * Checks if a query is likely answerable by uploaded documents.
 * This provides early feedback to users and prevents irrelevant queries.
 */

import { supabase } from "./supabase";
import { getModelFallbackClient } from "./model-fallback";

export interface CoverageCheck {
  likely_answerable: boolean;
  reason: string;
  available_documents: string[];
  suggested_documents?: string[];
}

/**
 * Check if query is likely answerable by uploaded documents
 *
 * This prevents users from asking questions that clearly won't be answered
 * (e.g., asking about 316L when only 2205 is uploaded)
 *
 * @param query - The user's search query
 * @returns Coverage check result
 */
export async function checkDocumentCoverage(query: string): Promise<CoverageCheck> {
  // Step 1: Get list of uploaded documents
  const { data: docs, error } = await supabase
    .from("documents")
    .select("filename")
    .eq("status", "indexed");

  if (error) {
    console.error("[Coverage Check] Failed to fetch documents:", error);
    // Fail open: assume query might be answerable
    return {
      likely_answerable: true,
      reason: "Could not check document coverage",
      available_documents: [],
    };
  }

  const docNames = docs?.map(d => d.filename) || [];

  // If no documents, definitely can't answer
  if (docNames.length === 0) {
    return {
      likely_answerable: false,
      reason: "No documents have been uploaded yet",
      available_documents: [],
    };
  }

  // Step 2: Use LLM to check if query matches available docs
  const client = getModelFallbackClient();

  const prompt = `You are analyzing if a user's query can be answered by available documents.

AVAILABLE DOCUMENTS: ${docNames.join(', ')}

USER QUERY: "${query}"

TASK: Determine if this query is likely answerable by the available documents.

Consider:
- Do the document names suggest relevant content?
- Are the topics in the query related to the documents?
- Would you need other documents to answer this?

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "likely_answerable": true|false,
  "reason": "Brief explanation (1 sentence)",
  "suggested_documents": ["document names that would help if missing"]
}`;

  try {
    const { text } = await client.generateContent(prompt, "gemini-2.5-flash");

    // Clean up response - remove markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const result = JSON.parse(cleanedText);

    return {
      likely_answerable: result.likely_answerable ?? true, // Fail open
      reason: result.reason || "Unknown",
      available_documents: docNames,
      suggested_documents: result.suggested_documents,
    };
  } catch (error) {
    console.error("[Coverage Check] Failed to analyze coverage:", error);

    // Fail open: assume query might be answerable
    return {
      likely_answerable: true,
      reason: "Coverage check failed, assuming query might be answerable",
      available_documents: docNames,
    };
  }
}

/**
 * Fast heuristic check without LLM call
 *
 * This provides a quick check based on simple rules.
 * Use this for fast paths where you want to avoid LLM overhead.
 */
export async function quickCoverageCheck(query: string): Promise<boolean> {
  const { data: docs } = await supabase
    .from("documents")
    .select("id")
    .eq("status", "indexed")
    .limit(1);

  // If any documents exist, assume query might be answerable
  return (docs?.length || 0) > 0;
}
