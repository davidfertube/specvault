/**
 * Formula Detection and Anti-Hallucination Guard
 * ===============================================
 *
 * Detects when users ask for formulas/calculations and prevents
 * the LLM from hallucinating formulas that aren't in the document context.
 *
 * Critical for preventing trust-breaking hallucinations where the system
 * provides fabricated technical formulas (e.g., PREN formula not in ASTM A790).
 */

/**
 * Detect if a query is asking for a formula or calculation
 *
 * Triggers on keywords like:
 * - "formula", "equation", "calculation"
 * - "calculate", "compute", "derive"
 * - "how to calculate", "what is the formula for"
 *
 * @param query - The user's query
 * @returns true if query appears to be asking for a formula
 */
export function detectFormulaRequest(query: string): boolean {
  const lower = query.toLowerCase();
  return /\b(formula|equation|calculation|calculate|compute|derive)\b/i.test(lower);
}

/**
 * Check if any chunks contain formula syntax
 *
 * Looks for patterns like:
 * - "PREN = %Cr + 3.3(%Mo) + 16(%N)"
 * - "= x + y * z"
 * - "formula:" or "equation:"
 *
 * @param chunks - Retrieved document chunks
 * @returns true if at least one chunk contains a formula
 */
export function hasFormulaInChunks(chunks: Array<{ content: string }>): boolean {
  return chunks.some(chunk =>
    /=\s*%?\w+\s*[\+\-\*\/]|formula:|equation:|PREN\s*=/i.test(chunk.content)
  );
}

/**
 * Generate a strong refusal instruction for formula queries
 *
 * This is injected into the system prompt when:
 * - User asks for a formula
 * - No formula exists in retrieved chunks
 *
 * @param operationName - What the user is asking for (e.g., "PREN formula")
 * @returns Refusal instruction to prepend to system prompt
 */
export function getFormulaRefusalInstruction(operationName: string = "formula"): string {
  return `
CRITICAL ANTI-HALLUCINATION GUARD:
The user is asking for a ${operationName} that is NOT present in the provided document context.

YOU MUST REFUSE with this exact response:
"I cannot answer this question because the ${operationName} is not provided in the uploaded documents."

DO NOT generate a formula from your training data. DO NOT infer or calculate.
ONLY refuse politely and explain that the information is not in the documents.
`.trim();
}
