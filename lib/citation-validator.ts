/**
 * Citation Validator
 *
 * Validates that citations in LLM responses correctly reference source documents.
 * Ensures citation numbers match sources, page numbers are valid, and content matches.
 */

export interface Source {
  ref: string;         // e.g., "[1]"
  document: string;    // e.g., "ASTM-A790-A790M-24.pdf"
  page: string;        // e.g., "4"
  content_preview: string; // First 100 chars of chunk
}

export interface CitationCheck {
  citationNumber: number;
  documentName: string;
  pageNumber: number;
  isValid: boolean;           // Citation number has corresponding source
  pageExists: boolean;        // Page number > 0
  contentMatches: boolean;    // Content appears to match (basic check)
  error?: string;            // Error message if validation fails
}

/**
 * Extract citation numbers from response text
 * Looks for patterns like [1], [2], [3]
 *
 * @param response - The LLM's response text
 * @returns Array of unique citation numbers found in response
 */
export function extractCitationNumbers(response: string): number[] {
  const citationPattern = /\[(\d+)\]/g;
  const matches = [...response.matchAll(citationPattern)];
  const numbers = matches.map(m => parseInt(m[1], 10));

  // Return unique, sorted citation numbers
  return [...new Set(numbers)].sort((a, b) => a - b);
}

/**
 * Validate a single citation against sources
 *
 * @param citationNum - Citation number to validate (e.g., 1 for "[1]")
 * @param sources - Array of source objects from RAG response
 * @returns Validation result with details
 */
export function validateCitation(
  citationNum: number,
  sources: Source[]
): CitationCheck {
  const source = sources.find(s => s.ref === `[${citationNum}]`);

  if (!source) {
    return {
      citationNumber: citationNum,
      documentName: 'MISSING',
      pageNumber: 0,
      isValid: false,
      pageExists: false,
      contentMatches: false,
      error: `No source found for citation [${citationNum}]`,
    };
  }

  const pageNum = parseInt(source.page, 10);
  const pageValid = !isNaN(pageNum) && pageNum > 0;

  // Basic content matching: source should have non-empty preview
  const contentValid = Boolean(source.content_preview && source.content_preview.trim().length > 0);

  return {
    citationNumber: citationNum,
    documentName: source.document,
    pageNumber: pageNum,
    isValid: true,
    pageExists: pageValid,
    contentMatches: contentValid,
    error: !pageValid ? 'Invalid page number' : !contentValid ? 'Empty content preview' : undefined,
  };
}

/**
 * Validate all citations in a response
 *
 * @param response - The LLM's response text
 * @param sources - Array of source objects from RAG response
 * @returns Array of validation results for each citation
 */
export function validateCitations(
  response: string,
  sources: Source[]
): CitationCheck[] {
  const citationNumbers = extractCitationNumbers(response);
  return citationNumbers.map(num => validateCitation(num, sources));
}

/**
 * Get citation accuracy statistics
 *
 * @param checks - Array of citation validation results
 * @returns Statistics object with accuracy percentages
 */
export function getCitationStats(checks: CitationCheck[]): {
  total: number;
  valid: number;
  validPages: number;
  validContent: number;
  accuracy: number;        // Percentage of valid citations
  pageAccuracy: number;    // Percentage with valid page numbers
  contentAccuracy: number; // Percentage with valid content
} {
  if (checks.length === 0) {
    return {
      total: 0,
      valid: 0,
      validPages: 0,
      validContent: 0,
      accuracy: 0,
      pageAccuracy: 0,
      contentAccuracy: 0,
    };
  }

  const valid = checks.filter(c => c.isValid).length;
  const validPages = checks.filter(c => c.pageExists).length;
  const validContent = checks.filter(c => c.contentMatches).length;

  return {
    total: checks.length,
    valid,
    validPages,
    validContent,
    accuracy: (valid / checks.length) * 100,
    pageAccuracy: (validPages / checks.length) * 100,
    contentAccuracy: (validContent / checks.length) * 100,
  };
}

/**
 * Format citation validation results for logging
 *
 * @param checks - Array of citation validation results
 * @returns Human-readable summary string
 */
export function formatCitationReport(checks: CitationCheck[]): string {
  if (checks.length === 0) {
    return 'No citations found in response';
  }

  const stats = getCitationStats(checks);
  const lines: string[] = [];

  lines.push(`📎 CITATION VALIDATION:`);
  lines.push(`   Total citations: ${stats.total}`);
  lines.push(`   Valid citations: ${stats.valid}/${stats.total} (${stats.accuracy.toFixed(1)}%)`);
  lines.push(`   Valid page numbers: ${stats.validPages}/${stats.total} (${stats.pageAccuracy.toFixed(1)}%)`);
  lines.push(`   Valid content: ${stats.validContent}/${stats.total} (${stats.contentAccuracy.toFixed(1)}%)`);

  const failures = checks.filter(c => !c.isValid || !c.pageExists || !c.contentMatches);
  if (failures.length > 0) {
    lines.push(`\n   Issues:`);
    failures.forEach(f => {
      lines.push(`   - [${f.citationNumber}]: ${f.error || 'Unknown error'}`);
    });
  }

  return lines.join('\n');
}

/**
 * Check if a response has good citation quality
 *
 * A response has good citations if:
 * - At least one citation exists
 * - 100% of citations are valid
 * - 100% of citations have valid page numbers
 *
 * @param response - The LLM's response text
 * @param sources - Array of source objects
 * @returns true if citation quality is good
 */
export function hasGoodCitations(response: string, sources: Source[]): boolean {
  const checks = validateCitations(response, sources);

  if (checks.length === 0) {
    return false; // No citations
  }

  const stats = getCitationStats(checks);
  return stats.accuracy === 100 && stats.pageAccuracy === 100;
}
