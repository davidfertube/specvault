/**
 * Stress Tests with Synthetic Documents
 *
 * Tests the RAG pipeline with large, complex synthetic ASTM-style documents
 * to verify performance and accuracy at scale.
 */

import { describe, it, expect } from 'vitest';
import {
  generateComplexDocument,
  generateEdgeCaseDocument,
  getSyntheticDocumentText,
  getDocumentStatistics,
} from './synthetic-doc-generator';
import { classifyQuery, expandQuery, optimizeQuery } from '@/lib/dspy-optimizer';

describe('Synthetic Document Generation', () => {
  it('should generate complex document with expected structure', () => {
    const doc = generateComplexDocument(50); // Use smaller size for unit test
    const stats = getDocumentStatistics(doc);

    expect(doc.pages.length).toBeGreaterThanOrEqual(50);
    expect(doc.grades.length).toBeGreaterThan(0);
    expect(stats.tableCount).toBeGreaterThan(0);
    expect(stats.wordCount).toBeGreaterThan(1000);

    // Verify content structure
    const fullText = getSyntheticDocumentText(doc);
    expect(fullText).toContain('TABLE 1 Chemical Requirements');
    expect(fullText).toContain('TABLE 2 Mechanical Requirements');
    expect(fullText).toContain('TABLE 3 Heat Treatment Requirements');
    expect(fullText).toContain('PREN');
  });

  it('should generate edge case document with special characters', () => {
    const doc = generateEdgeCaseDocument(50); // Use smaller size for unit test
    const fullText = getSyntheticDocumentText(doc);

    // Check for special characters and edge cases
    expect(fullText).toContain('±');
    expect(fullText).toContain('≥');
    expect(fullText).toContain('≤');
    expect(fullText).toContain('°C');
    expect(fullText).toContain('°F');
    expect(fullText).toContain('µm');
    expect(fullText).toContain('H₂S');
    expect(fullText).toContain('CO₂');

    // Check for acronyms section
    expect(fullText).toContain('ASTM - American Society');
    expect(fullText).toContain('UNS - Unified Numbering System');
    expect(fullText).toContain('PREN - Pitting Resistance');
  });

  it('should generate valid grade data with chemical compositions', () => {
    const doc = generateComplexDocument(30);

    for (const grade of doc.grades.slice(0, 5)) {
      // Verify grade structure
      expect(grade.designation).toMatch(/^F\d+$/);
      expect(grade.unsNumber).toMatch(/^[SJ]\d{5}$/);
      expect(grade.tensileStrength.min).toBeGreaterThan(0);
      expect(grade.yieldStrength.min).toBeGreaterThan(0);
      expect(grade.elongation.min).toBeGreaterThan(0);

      // Verify chemical composition
      expect(Object.keys(grade.chemicalComposition).length).toBeGreaterThan(0);
    }
  });
});

describe('DSPy Optimizer with Synthetic Content', () => {
  it('should classify synthetic document queries correctly', () => {
    const queries = [
      { q: 'What is the yield strength of F100?', expected: 'lookup' },
      { q: 'Compare F100 vs F101 chromium content', expected: 'comparison' },
      { q: 'List all UNS numbers in the synthetic spec', expected: 'list' },
      { q: 'Which grades are covered by this specification?', expected: 'list' },
      // "What is a X" triggers explanation, "What is the X for Y" triggers lookup
      { q: 'What is the PREN calculation for tungsten grades?', expected: 'lookup' },
    ];

    for (const { q, expected } of queries) {
      const result = classifyQuery(q);
      expect(result.intent).toBe(expected);
    }
  });

  it('should expand synthetic grade names', () => {
    const query = 'F51 yield strength';
    const classification = classifyQuery(query);
    const expanded = expandQuery(query, classification.entities);

    // F51 should expand to include S31803
    expect(expanded.toLowerCase()).toContain('s31803');
  });

  it('should optimize queries for synthetic document retrieval', () => {
    const result = optimizeQuery('Compare tensile strength F100 and F101');

    expect(result.classification.intent).toBe('comparison');
    expect(result.searchConfig.enableReranking).toBe(true);
    expect(result.fewShotPrompt).toContain('Example');
  });
});

describe('Document Statistics Validation', () => {
  it('should calculate accurate statistics for complex document', () => {
    const doc = generateComplexDocument(100);
    const stats = getDocumentStatistics(doc);

    expect(stats.pageCount).toBe(doc.pages.length);
    expect(stats.gradeCount).toBe(doc.grades.length);
    expect(stats.wordCount).toBeGreaterThan(0);
    expect(stats.charCount).toBeGreaterThan(stats.wordCount); // chars > words
    expect(stats.avgCharsPerPage).toBeGreaterThan(100);
  });

  it('should handle 300-page stress test size', () => {
    // Generate full-size document (this tests memory/performance)
    const doc = generateComplexDocument(300);
    const stats = getDocumentStatistics(doc);

    expect(stats.pageCount).toBeGreaterThanOrEqual(300);
    // Table count: 3 tables per batch of 10 grades, ~50 grades for 300 pages = ~15 tables
    expect(stats.tableCount).toBeGreaterThan(10);
    expect(stats.gradeCount).toBeGreaterThan(40);

    // Content validation
    const text = getSyntheticDocumentText(doc);
    expect(text.length).toBeGreaterThan(100000); // >100KB of text
  });

  it('should handle 300-page edge case document', () => {
    const doc = generateEdgeCaseDocument(300);
    const stats = getDocumentStatistics(doc);

    expect(stats.pageCount).toBeGreaterThanOrEqual(300);
    expect(stats.formulaCount).toBeGreaterThan(10);

    // Verify edge cases are present throughout
    const text = getSyntheticDocumentText(doc);
    const symbolCount = (text.match(/[±≥≤°µ]/g) || []).length;
    expect(symbolCount).toBeGreaterThan(100); // Many special symbols
  });
});
