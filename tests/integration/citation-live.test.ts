/**
 * Live Citation Integration Test
 *
 * Tests citation accuracy against the running RAG API
 * Validates page numbers, char offsets, and document references
 *
 * NOTE: These tests require the development server to be running
 * Run with: npm test -- --run tests/integration/citation-live.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { validateCitation, validateAllCitations } from '../evaluation/citation-accuracy.test';

const API_URL = process.env.RAG_ENDPOINT || 'http://localhost:3000/api/chat';
const TEST_TIMEOUT = 30000; // 30 seconds per test

interface Source {
  ref: string;
  document: string;
  page: string;
  content_preview?: string;
  document_url?: string;
  char_offset_start?: number;
  char_offset_end?: number;
}

interface RAGResponse {
  response: string;
  sources: Source[];
}

async function queryRAG(query: string): Promise<RAGResponse> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

describe.skip('Live Citation Accuracy', () => {
  // Skip by default - run manually with: npm test -- --run tests/integration
  let serverAvailable = true;

  beforeAll(async () => {
    try {
      await fetch(API_URL, { method: 'HEAD' });
    } catch {
      serverAvailable = false;
    }
  });

  it('should include page numbers in all citations', async () => {
    if (!serverAvailable) {
      console.log('Skipping: Server not available');
      return;
    }

    const result = await queryRAG('What is the yield strength of S32205 per A790?');

    expect(result.sources.length).toBeGreaterThan(0);

    for (const source of result.sources) {
      const pageNum = parseInt(source.page);
      expect(pageNum).toBeGreaterThan(0);
      expect(pageNum).toBeLessThan(1000);
    }
  });

  it('should include char offsets for PDF highlighting', async () => {
    if (!serverAvailable) {
      console.log('Skipping: Server not available');
      return;
    }

    const result = await queryRAG('What is the chromium content for duplex steel?');

    expect(result.sources.length).toBeGreaterThan(0);

    for (const source of result.sources) {
      // All sources should have char offsets for highlighting
      expect(source.char_offset_start).toBeDefined();
      expect(source.char_offset_end).toBeDefined();
      expect(source.char_offset_start).toBeGreaterThanOrEqual(0);
      expect(source.char_offset_end).toBeGreaterThan(source.char_offset_start!);
    }
  });

  it('should have valid document URLs', async () => {
    if (!serverAvailable) {
      console.log('Skipping: Server not available');
      return;
    }

    const result = await queryRAG('What testing is required for pipe specifications?');

    expect(result.sources.length).toBeGreaterThan(0);

    for (const source of result.sources) {
      expect(source.document_url).toBeDefined();
      expect(source.document_url).toMatch(/^https?:\/\//);
    }
  });

  it('should have meaningful content previews', async () => {
    if (!serverAvailable) {
      console.log('Skipping: Server not available');
      return;
    }

    const result = await queryRAG('What is the hardness requirement for S32205?');

    expect(result.sources.length).toBeGreaterThan(0);

    for (const source of result.sources) {
      expect(source.content_preview).toBeDefined();
      expect(source.content_preview!.length).toBeGreaterThan(10);
      // Preview should be truncated with ellipsis
      expect(source.content_preview).toMatch(/\.\.\.$/);
    }
  });

  it('should pass full citation validation', async () => {
    if (!serverAvailable) {
      console.log('Skipping: Server not available');
      return;
    }

    const result = await queryRAG('What are the mechanical properties of duplex stainless steel per ASTM A790?');

    expect(result.sources.length).toBeGreaterThan(0);

    const validation = validateAllCitations(result.sources);
    expect(validation.allValid).toBe(true);
    expect(validation.totalErrors).toBe(0);

    // Log any warnings for visibility
    if (validation.totalWarnings > 0) {
      console.log('Citation warnings:', validation.results.flatMap(r => r.warnings));
    }
  });

  it('should cite correct document for specific spec queries', async () => {
    if (!serverAvailable) {
      console.log('Skipping: Server not available');
      return;
    }

    const result = await queryRAG('What is the yield strength per ASTM A790?');

    expect(result.sources.length).toBeGreaterThan(0);

    // Should cite A790 document, not A789
    const hasA790 = result.sources.some(s =>
      s.document.toLowerCase().includes('a790')
    );
    expect(hasA790).toBe(true);
  });

  it('should not have overlapping char offsets on same page', async () => {
    if (!serverAvailable) {
      console.log('Skipping: Server not available');
      return;
    }

    const result = await queryRAG('What are all the grades covered by A790?');

    // Group sources by document and page
    const byPage = new Map<string, Source[]>();
    for (const source of result.sources) {
      const key = `${source.document}:${source.page}`;
      if (!byPage.has(key)) {
        byPage.set(key, []);
      }
      byPage.get(key)!.push(source);
    }

    // Check for non-overlapping offsets on same page
    for (const [key, sources] of byPage) {
      if (sources.length > 1) {
        const sorted = sources.sort((a, b) =>
          (a.char_offset_start ?? 0) - (b.char_offset_start ?? 0)
        );

        for (let i = 1; i < sorted.length; i++) {
          const prev = sorted[i - 1];
          const curr = sorted[i];
          if (prev.char_offset_end && curr.char_offset_start) {
            // Allow small overlap (100 chars) due to chunking
            expect(curr.char_offset_start).toBeGreaterThanOrEqual(
              prev.char_offset_end! - 100
            );
          }
        }
      }
    }
  });
});

describe.skip('Citation Stress Test', () => {
  // Skip by default - run manually with: npm test -- --run tests/integration
  let serverAvailable = true;

  beforeAll(async () => {
    try {
      await fetch(API_URL, { method: 'HEAD' });
    } catch {
      serverAvailable = false;
    }
  });

  const stressQueries = [
    'What is the yield strength of S32205?',
    'Compare mechanical properties of S32750 and S32205',
    'What testing is required for A790 pipe?',
    'What is the chromium content for duplex grades?',
    'What heat treatment is specified for S31803?',
  ];

  it('should maintain citation quality under multiple queries', async () => {
    if (!serverAvailable) {
      console.log('Skipping: Server not available');
      return;
    }

    let totalSources = 0;
    let validSources = 0;
    const errors: string[] = [];

    for (const query of stressQueries) {
      try {
        const result = await queryRAG(query);

        for (const source of result.sources) {
          totalSources++;
          const validation = validateCitation(source);
          if (validation.valid) {
            validSources++;
          } else {
            errors.push(`[${query}] ${validation.errors.join(', ')}`);
          }
        }
      } catch (e) {
        errors.push(`Query failed: ${query}`);
      }

      // Small delay between queries
      await new Promise(r => setTimeout(r, 500));
    }

    // Expect at least 95% valid citations
    const validRate = totalSources > 0 ? validSources / totalSources : 0;
    console.log(`Citation validity: ${validSources}/${totalSources} (${(validRate * 100).toFixed(1)}%)`);

    if (errors.length > 0) {
      console.log('Errors:', errors.slice(0, 5));
    }

    expect(validRate).toBeGreaterThanOrEqual(0.95);
  });
});
