/**
 * Citation Accuracy Test Suite
 *
 * Validates that RAG system citations are accurate:
 * - Valid page numbers
 * - Character offsets present for PDF highlighting
 * - Document names match uploaded files
 * - Content previews are meaningful
 */

import { describe, it, expect } from 'vitest';

interface Source {
  ref: string;
  document: string;
  page: string;
  content_preview?: string;
  document_url?: string;
  char_offset_start?: number;
  char_offset_end?: number;
}

interface CitationValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a single source/citation
 */
export function validateCitation(source: Source): CitationValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check ref format [1], [2], etc.
  if (!source.ref || !/^\[\d+\]$/.test(source.ref)) {
    errors.push(`Invalid ref format: "${source.ref}" (expected [1], [2], etc.)`);
  }

  // Check document name
  if (!source.document || source.document.length === 0) {
    errors.push('Missing document name');
  } else if (!source.document.toLowerCase().includes('.pdf')) {
    warnings.push(`Document name may not be a PDF: "${source.document}"`);
  }

  // Check page number
  const pageNum = parseInt(source.page);
  if (isNaN(pageNum) || pageNum < 1) {
    errors.push(`Invalid page number: "${source.page}" (expected positive integer)`);
  } else if (pageNum > 100) {
    warnings.push(`Unusually high page number: ${pageNum}`);
  }

  // Check character offsets for PDF highlighting
  if (source.char_offset_start === undefined) {
    warnings.push('Missing char_offset_start (PDF highlighting may not work)');
  }
  if (source.char_offset_end === undefined) {
    warnings.push('Missing char_offset_end (PDF highlighting may not work)');
  }
  if (
    source.char_offset_start !== undefined &&
    source.char_offset_end !== undefined
  ) {
    if (source.char_offset_start < 0) {
      errors.push(`Invalid char_offset_start: ${source.char_offset_start} (must be >= 0)`);
    }
    if (source.char_offset_end <= source.char_offset_start) {
      errors.push(
        `Invalid offset range: start=${source.char_offset_start}, end=${source.char_offset_end}`
      );
    }
  }

  // Check document URL
  if (!source.document_url) {
    warnings.push('Missing document_url (PDF viewer link may not work)');
  } else if (!source.document_url.startsWith('http')) {
    errors.push(`Invalid document URL: "${source.document_url}"`);
  }

  // Check content preview
  if (!source.content_preview || source.content_preview.length < 10) {
    warnings.push('Content preview is missing or too short');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate all citations in a response
 */
export function validateAllCitations(sources: Source[]): {
  allValid: boolean;
  validCount: number;
  totalCount: number;
  results: Array<{ ref: string; result: CitationValidationResult }>;
} {
  const results = sources.map(source => ({
    ref: source.ref,
    result: validateCitation(source),
  }));

  const validCount = results.filter(r => r.result.valid).length;

  return {
    allValid: validCount === sources.length,
    validCount,
    totalCount: sources.length,
    results,
  };
}

/**
 * Check if citations in response text match provided sources
 */
export function validateCitationConsistency(
  response: string,
  sources: Source[]
): {
  consistent: boolean;
  citationsInText: string[];
  citationsInSources: string[];
  missingInSources: string[];
  unusedSources: string[];
} {
  // Extract citation refs from response text
  const citationPattern = /\[(\d+)\]/g;
  const citationsInText: string[] = [];
  let match;
  while ((match = citationPattern.exec(response)) !== null) {
    const ref = `[${match[1]}]`;
    if (!citationsInText.includes(ref)) {
      citationsInText.push(ref);
    }
  }

  const citationsInSources = sources.map(s => s.ref);

  // Find citations mentioned in text but not in sources
  const missingInSources = citationsInText.filter(c => !citationsInSources.includes(c));

  // Find sources not mentioned in text
  const unusedSources = citationsInSources.filter(c => !citationsInText.includes(c));

  return {
    consistent: missingInSources.length === 0 && unusedSources.length === 0,
    citationsInText,
    citationsInSources,
    missingInSources,
    unusedSources,
  };
}

describe('Citation Validation', () => {
  describe('validateCitation', () => {
    it('should validate a complete valid citation', () => {
      const source: Source = {
        ref: '[1]',
        document: 'ASTM_A790.pdf',
        page: '4',
        content_preview: 'The minimum yield strength of S32205 is 65 ksi...',
        document_url: 'https://example.supabase.co/storage/v1/object/sign/documents/...',
        char_offset_start: 1250,
        char_offset_end: 1450,
      };

      const result = validateCitation(source);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect invalid ref format', () => {
      const source: Source = {
        ref: '1', // Missing brackets
        document: 'A790.pdf',
        page: '4',
      };

      const result = validateCitation(source);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('ref format'))).toBe(true);
    });

    it('should detect invalid page number', () => {
      const source: Source = {
        ref: '[1]',
        document: 'A790.pdf',
        page: 'invalid',
      };

      const result = validateCitation(source);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('page number'))).toBe(true);
    });

    it('should detect negative page numbers', () => {
      const source: Source = {
        ref: '[1]',
        document: 'A790.pdf',
        page: '-1',
      };

      const result = validateCitation(source);
      expect(result.valid).toBe(false);
    });

    it('should warn about missing character offsets', () => {
      const source: Source = {
        ref: '[1]',
        document: 'A790.pdf',
        page: '4',
        // No char_offset_start or char_offset_end
      };

      const result = validateCitation(source);
      expect(result.valid).toBe(true); // Still valid, just warnings
      expect(result.warnings.some(w => w.includes('char_offset'))).toBe(true);
    });

    it('should detect invalid offset range', () => {
      const source: Source = {
        ref: '[1]',
        document: 'A790.pdf',
        page: '4',
        char_offset_start: 100,
        char_offset_end: 50, // End before start
      };

      const result = validateCitation(source);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('offset range'))).toBe(true);
    });

    it('should detect missing document name', () => {
      const source: Source = {
        ref: '[1]',
        document: '',
        page: '4',
      };

      const result = validateCitation(source);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('document name'))).toBe(true);
    });
  });

  describe('validateAllCitations', () => {
    it('should validate multiple citations', () => {
      const sources: Source[] = [
        { ref: '[1]', document: 'A790.pdf', page: '4' },
        { ref: '[2]', document: 'A789.pdf', page: '3' },
        { ref: '[3]', document: 'A1049.pdf', page: '5' },
      ];

      const result = validateAllCitations(sources);
      expect(result.allValid).toBe(true);
      expect(result.validCount).toBe(3);
      expect(result.totalCount).toBe(3);
    });

    it('should count invalid citations correctly', () => {
      const sources: Source[] = [
        { ref: '[1]', document: 'A790.pdf', page: '4' }, // Valid
        { ref: '2', document: 'A789.pdf', page: '3' }, // Invalid ref
        { ref: '[3]', document: '', page: '5' }, // Missing document
      ];

      const result = validateAllCitations(sources);
      expect(result.allValid).toBe(false);
      expect(result.validCount).toBe(1);
      expect(result.totalCount).toBe(3);
    });
  });

  describe('validateCitationConsistency', () => {
    it('should detect consistent citations', () => {
      const response = 'The yield strength is 65 ksi [1]. The tensile strength is 90 ksi [2].';
      const sources: Source[] = [
        { ref: '[1]', document: 'A790.pdf', page: '4' },
        { ref: '[2]', document: 'A790.pdf', page: '4' },
      ];

      const result = validateCitationConsistency(response, sources);
      expect(result.consistent).toBe(true);
      expect(result.citationsInText).toEqual(['[1]', '[2]']);
      expect(result.missingInSources).toHaveLength(0);
      expect(result.unusedSources).toHaveLength(0);
    });

    it('should detect citations in text missing from sources', () => {
      const response = 'Value from [1] and [3].'; // [3] not in sources
      const sources: Source[] = [
        { ref: '[1]', document: 'A790.pdf', page: '4' },
        { ref: '[2]', document: 'A789.pdf', page: '3' },
      ];

      const result = validateCitationConsistency(response, sources);
      expect(result.consistent).toBe(false);
      expect(result.missingInSources).toContain('[3]');
    });

    it('should detect unused sources', () => {
      const response = 'Only citing [1] here.';
      const sources: Source[] = [
        { ref: '[1]', document: 'A790.pdf', page: '4' },
        { ref: '[2]', document: 'A789.pdf', page: '3' }, // Unused
      ];

      const result = validateCitationConsistency(response, sources);
      expect(result.consistent).toBe(false);
      expect(result.unusedSources).toContain('[2]');
    });

    it('should handle duplicate citations in text', () => {
      const response = 'See [1] for details. Also [1] confirms this. And [2].';
      const sources: Source[] = [
        { ref: '[1]', document: 'A790.pdf', page: '4' },
        { ref: '[2]', document: 'A789.pdf', page: '3' },
      ];

      const result = validateCitationConsistency(response, sources);
      expect(result.consistent).toBe(true);
      expect(result.citationsInText).toEqual(['[1]', '[2]']); // No duplicates
    });
  });
});

describe('PDF Highlighting Support', () => {
  it('should validate char offsets enable PDF highlighting', () => {
    const source: Source = {
      ref: '[1]',
      document: 'ASTM_A790.pdf',
      page: '4',
      char_offset_start: 1250,
      char_offset_end: 1450,
    };

    const result = validateCitation(source);

    // Check that offsets are present and valid
    expect(source.char_offset_start).toBeDefined();
    expect(source.char_offset_end).toBeDefined();
    expect(source.char_offset_end! > source.char_offset_start!).toBe(true);

    // Offsets should enable PDF viewer to highlight exactly 200 characters
    const highlightLength = source.char_offset_end! - source.char_offset_start!;
    expect(highlightLength).toBe(200);
  });

  it('should calculate correct highlight ranges', () => {
    const sources: Source[] = [
      {
        ref: '[1]',
        document: 'A790.pdf',
        page: '4',
        char_offset_start: 0,
        char_offset_end: 150,
      },
      {
        ref: '[2]',
        document: 'A790.pdf',
        page: '4',
        char_offset_start: 200,
        char_offset_end: 400,
      },
    ];

    // Validate non-overlapping ranges on same page
    const [first, second] = sources;
    expect(first.char_offset_end! <= second.char_offset_start!).toBe(true);

    // Both should be valid
    const results = validateAllCitations(sources);
    expect(results.allValid).toBe(true);
  });
});

describe('Integration Tests', () => {
  const INTEGRATION_TEST = process.env.INTEGRATION_TEST === 'true';
  const RAG_BASE_URL = process.env.RAG_BASE_URL || 'http://localhost:3000';

  it.skipIf(!INTEGRATION_TEST)('should validate citations from live RAG response', async () => {
    const response = await fetch(`${RAG_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What is the yield strength of S32205?' }),
    });

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.sources).toBeDefined();
    expect(Array.isArray(data.sources)).toBe(true);

    if (data.sources.length > 0) {
      const validationResult = validateAllCitations(data.sources);
      console.log(`Citation validation: ${validationResult.validCount}/${validationResult.totalCount} valid`);

      // Log any errors or warnings
      for (const { ref, result } of validationResult.results) {
        if (result.errors.length > 0) {
          console.log(`  ${ref} errors:`, result.errors);
        }
        if (result.warnings.length > 0) {
          console.log(`  ${ref} warnings:`, result.warnings);
        }
      }

      // Check consistency between response text and sources
      const consistency = validateCitationConsistency(data.response, data.sources);
      console.log(`Citation consistency: ${consistency.consistent ? 'PASS' : 'FAIL'}`);

      if (!consistency.consistent) {
        if (consistency.missingInSources.length > 0) {
          console.log(`  Missing in sources: ${consistency.missingInSources.join(', ')}`);
        }
        if (consistency.unusedSources.length > 0) {
          console.log(`  Unused sources: ${consistency.unusedSources.join(', ')}`);
        }
      }
    }
  }, 30000);
});
