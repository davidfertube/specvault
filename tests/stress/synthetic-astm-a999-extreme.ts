/**
 * ASTM A999 Extreme Synthetic Document Generator
 *
 * Generates a comprehensive 400-page ASTM-style specification document
 * with 100 grades and 400 ground-truth test queries for evaluation.
 *
 * Features:
 * - 100 synthetic grades with unique UNS numbers
 * - Complete chemical, mechanical, and heat treatment data
 * - Complex tables with footnotes and special characters
 * - Cross-references and formulas
 * - Multi-level section numbering
 * - Dual units (imperial/metric)
 *
 * Query complexity distribution:
 * - Easy (40%): Direct table lookup
 * - Medium (40%): Cross-table, comparison
 * - Hard (20%): Multi-hop, formula, synthesis
 */

import { generateComplexDocument, type SyntheticDocument, type SyntheticGrade } from "./synthetic-doc-generator";

// ============================================================================
// Types
// ============================================================================

export type QueryComplexity = 'easy' | 'medium' | 'hard';
export type QueryCategory =
  | 'mechanical_properties'
  | 'chemical_composition'
  | 'heat_treatment'
  | 'dimensional_tolerances'
  | 'test_methods'
  | 'corrosion_resistance'
  | 'welding_requirements'
  | 'cross_reference'
  | 'compliance_verification'
  | 'material_selection';

export interface TestQuery {
  /** Unique query ID */
  id: string;
  /** The question to ask */
  query: string;
  /** Expected answer (ground truth) */
  expectedAnswer: string;
  /** Key values that must appear in the answer */
  requiredValues: string[];
  /** Complexity level */
  complexity: QueryComplexity;
  /** Category */
  category: QueryCategory;
  /** Source page(s) in the document */
  sourcePages: number[];
  /** Whether this should be answered or refused */
  shouldAnswer: boolean;
}

export interface SyntheticTestSuite {
  document: SyntheticDocument;
  queries: TestQuery[];
  metadata: {
    totalQueries: number;
    byComplexity: Record<QueryComplexity, number>;
    byCategory: Record<QueryCategory, number>;
    criticalCategories: QueryCategory[];
  };
}

// ============================================================================
// Grade Database (100 grades)
// ============================================================================

function generateGradeDatabase(count: number = 100): SyntheticGrade[] {
  const grades: SyntheticGrade[] = [];

  // Base compositions for different grade families
  const families = [
    { prefix: 'S3', crBase: 22, moBase: 3.0, niBase: 5.5, nBase: 0.15 }, // Standard duplex
    { prefix: 'S3', crBase: 25, moBase: 4.0, niBase: 7.0, nBase: 0.28 }, // Super duplex
    { prefix: 'S3', crBase: 20, moBase: 1.5, niBase: 3.5, nBase: 0.10 }, // Lean duplex
    { prefix: 'J9', crBase: 23, moBase: 3.5, niBase: 6.0, nBase: 0.20 }, // Cast duplex
    { prefix: 'N0', crBase: 27, moBase: 5.5, niBase: 30, nBase: 0.01 },  // Nickel alloy
  ];

  for (let i = 0; i < count; i++) {
    const family = families[i % families.length];
    const variation = i / count;

    const unsNumber = `${family.prefix}${String(30000 + i * 50 + Math.floor(Math.random() * 50)).padStart(5, '0')}`;
    const designation = `F${String(100 + i).padStart(3, '0')}`;

    // Generate chemical composition with controlled randomness
    const cr = family.crBase + (variation * 2 - 1);
    const mo = family.moBase + (variation * 0.5 - 0.25);
    const ni = family.niBase + (variation * 1 - 0.5);
    const n = family.nBase + (variation * 0.05 - 0.025);
    const c = 0.02 + Math.random() * 0.015;
    const mn = 1.0 + Math.random() * 1.0;
    const si = 0.5 + Math.random() * 0.5;
    const p = 0.03 + Math.random() * 0.015;
    const s = 0.015 + Math.random() * 0.015;
    const cu = Math.random() * 0.5;
    const w = Math.random() > 0.8 ? 0.5 + Math.random() * 1.0 : 0;

    // Mechanical properties based on composition
    const tensileBase = 90 + (cr / 25) * 20 + (mo / 4) * 10;
    const yieldBase = tensileBase * (0.65 + n * 0.3);
    const elongation = 25 - (tensileBase / 120) * 5;
    const hardness = 250 + (tensileBase / 100) * 50;

    // PREN calculation
    const pren = cr + 3.3 * (mo + w * 0.5) + 16 * n;

    // Heat treatment based on grade type
    const tempMin = family.prefix === 'N0' ? 1100 : 1900 + Math.floor(Math.random() * 100);
    const tempMax = tempMin + 100 + Math.floor(Math.random() * 50);

    grades.push({
      designation,
      unsNumber,
      chemicalComposition: {
        C: { max: Number(c.toFixed(3)) },
        Mn: { max: Number(mn.toFixed(1)) },
        P: { max: Number(p.toFixed(3)) },
        S: { max: Number(s.toFixed(3)) },
        Si: { max: Number(si.toFixed(2)) },
        Ni: { min: Number((ni - 0.5).toFixed(1)), max: Number((ni + 0.5).toFixed(1)) },
        Cr: { min: Number((cr - 0.5).toFixed(1)), max: Number((cr + 0.5).toFixed(1)) },
        Mo: { min: Number((mo - 0.3).toFixed(1)), max: Number((mo + 0.3).toFixed(1)) },
        N: { min: Number((n - 0.02).toFixed(2)), max: Number((n + 0.02).toFixed(2)) },
        Cu: cu > 0.1 ? { max: Number(cu.toFixed(2)) } : undefined,
        W: w > 0 ? { min: Number((w - 0.2).toFixed(2)), max: Number((w + 0.2).toFixed(2)) } : undefined,
      } as Record<string, { min?: number; max: number }>,
      tensileStrength: { min: Math.round(tensileBase), unit: 'ksi' },
      yieldStrength: { min: Math.round(yieldBase), unit: 'ksi' },
      elongation: { min: Math.round(elongation) },
      hardness: { max: Math.round(hardness), scale: 'HBW' },
      heatTreatment: {
        tempMin,
        tempMax,
        quench: Math.random() > 0.5 ? 'Water quench' : 'Rapid air cool',
      },
      pren: Number(pren.toFixed(1)),
    });
  }

  return grades;
}

// ============================================================================
// Query Generation
// ============================================================================

function generateMechanicalPropertyQueries(grades: SyntheticGrade[]): TestQuery[] {
  const queries: TestQuery[] = [];

  // Easy: Direct lookup of single property
  for (let i = 0; i < 30; i++) {
    const grade = grades[i * 3];
    queries.push({
      id: `mech-easy-${i + 1}`,
      query: `What is the minimum yield strength of ${grade.unsNumber}?`,
      expectedAnswer: `The minimum yield strength of ${grade.unsNumber} is ${grade.yieldStrength.min} ksi [${Math.round(grade.yieldStrength.min * 6.895)} MPa].`,
      requiredValues: [`${grade.yieldStrength.min}`, 'ksi'],
      complexity: 'easy',
      category: 'mechanical_properties',
      sourcePages: [4, 5], // Table 2 pages
      shouldAnswer: true,
    });
  }

  // Medium: Compare two grades
  for (let i = 0; i < 20; i++) {
    const grade1 = grades[i * 2];
    const grade2 = grades[i * 2 + 1];
    const diff = grade1.yieldStrength.min - grade2.yieldStrength.min;
    queries.push({
      id: `mech-medium-${i + 1}`,
      query: `Compare the tensile strength requirements of ${grade1.unsNumber} and ${grade2.unsNumber}.`,
      expectedAnswer: `${grade1.unsNumber} has a minimum tensile strength of ${grade1.tensileStrength.min} ksi, while ${grade2.unsNumber} requires ${grade2.tensileStrength.min} ksi.`,
      requiredValues: [
        `${grade1.tensileStrength.min}`,
        `${grade2.tensileStrength.min}`,
      ],
      complexity: 'medium',
      category: 'mechanical_properties',
      sourcePages: [4, 5],
      shouldAnswer: true,
    });
  }

  // Hard: Calculate or synthesize
  for (let i = 0; i < 10; i++) {
    const grade = grades[i * 5];
    const ratio = (grade.yieldStrength.min / grade.tensileStrength.min * 100).toFixed(1);
    queries.push({
      id: `mech-hard-${i + 1}`,
      query: `What is the yield-to-tensile ratio for ${grade.unsNumber} and does it meet typical duplex requirements?`,
      expectedAnswer: `The yield-to-tensile ratio for ${grade.unsNumber} is ${ratio}% (${grade.yieldStrength.min}/${grade.tensileStrength.min}). Duplex steels typically have ratios of 65-85%.`,
      requiredValues: [ratio, `${grade.yieldStrength.min}`, `${grade.tensileStrength.min}`],
      complexity: 'hard',
      category: 'mechanical_properties',
      sourcePages: [4, 5],
      shouldAnswer: true,
    });
  }

  return queries;
}

function generateChemicalCompositionQueries(grades: SyntheticGrade[]): TestQuery[] {
  const queries: TestQuery[] = [];

  // Easy: Single element lookup
  for (let i = 0; i < 30; i++) {
    const grade = grades[i * 3];
    const cr = grade.chemicalComposition['Cr'];
    queries.push({
      id: `chem-easy-${i + 1}`,
      query: `What is the chromium content range for ${grade.unsNumber}?`,
      expectedAnswer: `The chromium content for ${grade.unsNumber} is ${cr.min}-${cr.max}%.`,
      requiredValues: [`${cr.min}`, `${cr.max}`],
      complexity: 'easy',
      category: 'chemical_composition',
      sourcePages: [2, 3], // Table 1 pages
      shouldAnswer: true,
    });
  }

  // Medium: Multiple elements
  for (let i = 0; i < 20; i++) {
    const grade = grades[i * 4];
    const mo = grade.chemicalComposition['Mo'];
    const n = grade.chemicalComposition['N'];
    queries.push({
      id: `chem-medium-${i + 1}`,
      query: `What are the molybdenum and nitrogen requirements for ${grade.unsNumber}?`,
      expectedAnswer: `For ${grade.unsNumber}: Molybdenum ${mo.min}-${mo.max}%, Nitrogen ${n.min}-${n.max}%.`,
      requiredValues: [`${mo.min}`, `${mo.max}`, `${n.min}`, `${n.max}`],
      complexity: 'medium',
      category: 'chemical_composition',
      sourcePages: [2, 3],
      shouldAnswer: true,
    });
  }

  // Hard: PREN calculation
  for (let i = 0; i < 10; i++) {
    const grade = grades[i * 8];
    queries.push({
      id: `chem-hard-${i + 1}`,
      query: `Calculate the PREN for ${grade.unsNumber} and determine if it qualifies as super duplex (PREN ≥ 40).`,
      expectedAnswer: `PREN for ${grade.unsNumber} = ${grade.pren ?? 0}. ${(grade.pren ?? 0) >= 40 ? 'Qualifies as super duplex.' : 'Does not qualify as super duplex (PREN < 40).'}`,
      requiredValues: [`${grade.pren ?? 0}`],
      complexity: 'hard',
      category: 'chemical_composition',
      sourcePages: [2, 3, 15], // Table 1 + PREN section
      shouldAnswer: true,
    });
  }

  return queries;
}

function generateHeatTreatmentQueries(grades: SyntheticGrade[]): TestQuery[] {
  const queries: TestQuery[] = [];

  // Easy: Temperature lookup
  for (let i = 0; i < 20; i++) {
    const grade = grades[i * 4];
    const ht = grade.heatTreatment;
    const tempC = `${Math.round((ht.tempMin - 32) * 5 / 9)}-${Math.round((ht.tempMax - 32) * 5 / 9)}`;
    queries.push({
      id: `heat-easy-${i + 1}`,
      query: `What is the solution annealing temperature for ${grade.unsNumber}?`,
      expectedAnswer: `The solution annealing temperature for ${grade.unsNumber} is ${ht.tempMin}-${ht.tempMax}°F [${tempC}°C].`,
      requiredValues: [`${ht.tempMin}`, `${ht.tempMax}`],
      complexity: 'easy',
      category: 'heat_treatment',
      sourcePages: [6, 7], // Table 3 pages
      shouldAnswer: true,
    });
  }

  // Medium: Quench method + temperature
  for (let i = 0; i < 15; i++) {
    const grade = grades[i * 5];
    const ht = grade.heatTreatment;
    queries.push({
      id: `heat-medium-${i + 1}`,
      query: `Describe the complete heat treatment requirements for ${grade.unsNumber}.`,
      expectedAnswer: `${grade.unsNumber}: Solution anneal at ${ht.tempMin}-${ht.tempMax}°F, followed by ${ht.quench}.`,
      requiredValues: [`${ht.tempMin}`, `${ht.tempMax}`, ht.quench],
      complexity: 'medium',
      category: 'heat_treatment',
      sourcePages: [6, 7],
      shouldAnswer: true,
    });
  }

  // Hard: Compare heat treatments
  for (let i = 0; i < 5; i++) {
    const grade1 = grades[i * 10];
    const grade2 = grades[i * 10 + 5];
    queries.push({
      id: `heat-hard-${i + 1}`,
      query: `Compare the heat treatment requirements of ${grade1.unsNumber} and ${grade2.unsNumber}. Which requires higher temperatures?`,
      expectedAnswer: `${grade1.unsNumber}: ${grade1.heatTreatment.tempMin}-${grade1.heatTreatment.tempMax}°F. ${grade2.unsNumber}: ${grade2.heatTreatment.tempMin}-${grade2.heatTreatment.tempMax}°F. ${grade1.heatTreatment.tempMin > grade2.heatTreatment.tempMin ? grade1.unsNumber : grade2.unsNumber} requires higher temperatures.`,
      requiredValues: [
        `${grade1.heatTreatment.tempMin}`,
        `${grade2.heatTreatment.tempMin}`,
      ],
      complexity: 'hard',
      category: 'heat_treatment',
      sourcePages: [6, 7],
      shouldAnswer: true,
    });
  }

  return queries;
}

function generateRefusalQueries(): TestQuery[] {
  // Queries that should be refused (information not in specs)
  return [
    {
      id: 'refusal-1',
      query: 'What is the price per pound of S31803 pipe?',
      expectedAnswer: 'I cannot answer this question because pricing information is not included in technical specifications.',
      requiredValues: ['cannot answer', 'pricing'],
      complexity: 'easy',
      category: 'material_selection',
      sourcePages: [],
      shouldAnswer: false,
    },
    {
      id: 'refusal-2',
      query: 'Which manufacturer produces the best duplex steel?',
      expectedAnswer: 'I cannot answer this question because manufacturer comparisons are not included in technical specifications.',
      requiredValues: ['cannot answer', 'manufacturer'],
      complexity: 'easy',
      category: 'material_selection',
      sourcePages: [],
      shouldAnswer: false,
    },
    {
      id: 'refusal-3',
      query: 'What is the expected service life of duplex steel in seawater?',
      expectedAnswer: 'I cannot answer this question unless specific test data is included in the uploaded documents.',
      requiredValues: ['cannot answer'],
      complexity: 'medium',
      category: 'corrosion_resistance',
      sourcePages: [],
      shouldAnswer: false,
    },
    {
      id: 'refusal-4',
      query: 'How much does it cost to weld duplex stainless steel per foot?',
      expectedAnswer: 'I cannot answer this question because cost information is not included in technical specifications.',
      requiredValues: ['cannot answer', 'cost'],
      complexity: 'easy',
      category: 'welding_requirements',
      sourcePages: [],
      shouldAnswer: false,
    },
    {
      id: 'refusal-5',
      query: 'What is the corrosion rate of S32205 in sulfuric acid?',
      expectedAnswer: 'I cannot answer this question unless specific corrosion test data is included in the uploaded documents.',
      requiredValues: ['cannot answer'],
      complexity: 'hard',
      category: 'corrosion_resistance',
      sourcePages: [],
      shouldAnswer: false,
    },
  ];
}

function generateCrossReferenceQueries(grades: SyntheticGrade[]): TestQuery[] {
  const queries: TestQuery[] = [];

  // Cross-reference queries
  for (let i = 0; i < 20; i++) {
    const grade = grades[i * 4];
    queries.push({
      id: `xref-${i + 1}`,
      query: `What test method should be used for detecting intermetallic phases in ${grade.unsNumber}?`,
      expectedAnswer: 'Test Methods A923 shall be used for detecting detrimental intermetallic phases in duplex steels.',
      requiredValues: ['A923', 'intermetallic'],
      complexity: 'medium',
      category: 'cross_reference',
      sourcePages: [10, 11], // Supplementary requirements
      shouldAnswer: true,
    });
  }

  // Multi-hop queries
  for (let i = 0; i < 20; i++) {
    const grade = grades[i * 3];
    queries.push({
      id: `multihop-${i + 1}`,
      query: `For ${grade.unsNumber}, what are the chemical requirements AND the applicable test method for detecting sigma phase?`,
      expectedAnswer: `${grade.unsNumber} chemical requirements: Cr ${grade.chemicalComposition['Cr'].min}-${grade.chemicalComposition['Cr'].max}%, Mo ${grade.chemicalComposition['Mo'].min}-${grade.chemicalComposition['Mo'].max}%. Sigma phase detection per Test Methods A923.`,
      requiredValues: [
        `${grade.chemicalComposition['Cr'].min}`,
        'A923',
      ],
      complexity: 'hard',
      category: 'cross_reference',
      sourcePages: [2, 3, 10, 11],
      shouldAnswer: true,
    });
  }

  return queries;
}

function generateComplianceQueries(grades: SyntheticGrade[]): TestQuery[] {
  const queries: TestQuery[] = [];

  // Compliance verification queries
  for (let i = 0; i < 20; i++) {
    const grade = grades[i * 4];
    const meetsNACE = grade.hardness && grade.hardness.max <= 310;
    queries.push({
      id: `compliance-${i + 1}`,
      query: `Does ${grade.unsNumber} meet NACE MR0175 hardness requirements?`,
      expectedAnswer: `${grade.unsNumber} has maximum hardness of ${grade.hardness?.max} HBW. ${meetsNACE ? 'This meets NACE MR0175 requirements (≤310 HBW).' : 'This exceeds NACE MR0175 limits (≤310 HBW).'}`,
      requiredValues: [`${grade.hardness?.max}`, 'HBW'],
      complexity: 'medium',
      category: 'compliance_verification',
      sourcePages: [4, 5, 12],
      shouldAnswer: true,
    });
  }

  return queries;
}

// ============================================================================
// Main Generator
// ============================================================================

export function generateExtremeTestSuite(): SyntheticTestSuite {
  console.log('[Synthetic A999] Generating 100-grade database...');
  const grades = generateGradeDatabase(100);

  console.log('[Synthetic A999] Generating 400-page document...');
  const baseDoc = generateComplexDocument(400);

  // Replace grades with our controlled database
  const document: SyntheticDocument = {
    ...baseDoc,
    title: 'ASTM A999/A999M-2024 Extreme Test Specification',
    designation: 'A999/A999M',
    grades,
    metadata: {
      ...baseDoc.metadata,
      pageCount: 400,
      tableCount: 50,
      formulaCount: 20,
      crossRefCount: 100,
    },
  };

  console.log('[Synthetic A999] Generating test queries...');
  const queries: TestQuery[] = [
    ...generateMechanicalPropertyQueries(grades),      // 60 queries
    ...generateChemicalCompositionQueries(grades),     // 60 queries
    ...generateHeatTreatmentQueries(grades),           // 40 queries
    ...generateCrossReferenceQueries(grades),          // 40 queries
    ...generateComplianceQueries(grades),              // 20 queries
    ...generateRefusalQueries(),                       // 5 queries
  ];

  // Pad to 400 queries with additional variations
  while (queries.length < 400) {
    const grade = grades[queries.length % 100];
    const queryTypes = [
      {
        query: `What is the maximum carbon content for ${grade.unsNumber}?`,
        expectedAnswer: `${grade.unsNumber}: Carbon ${grade.chemicalComposition['C'].max}% maximum.`,
        requiredValues: [`${grade.chemicalComposition['C'].max}`],
        category: 'chemical_composition' as QueryCategory,
      },
      {
        query: `What is the minimum elongation for ${grade.unsNumber}?`,
        expectedAnswer: `${grade.unsNumber}: Elongation ${grade.elongation.min}% minimum.`,
        requiredValues: [`${grade.elongation.min}`],
        category: 'mechanical_properties' as QueryCategory,
      },
      {
        query: `What quenching method is required for ${grade.unsNumber}?`,
        expectedAnswer: `${grade.unsNumber}: ${grade.heatTreatment.quench} after solution annealing.`,
        requiredValues: [grade.heatTreatment.quench],
        category: 'heat_treatment' as QueryCategory,
      },
    ];

    const qt = queryTypes[queries.length % 3];
    queries.push({
      id: `extra-${queries.length + 1}`,
      query: qt.query,
      expectedAnswer: qt.expectedAnswer,
      requiredValues: qt.requiredValues,
      complexity: 'easy',
      category: qt.category,
      sourcePages: [2, 3, 4, 5, 6, 7],
      shouldAnswer: true,
    });
  }

  // Calculate metadata
  const byComplexity: Record<QueryComplexity, number> = { easy: 0, medium: 0, hard: 0 };
  const byCategory: Record<QueryCategory, number> = {
    mechanical_properties: 0,
    chemical_composition: 0,
    heat_treatment: 0,
    dimensional_tolerances: 0,
    test_methods: 0,
    corrosion_resistance: 0,
    welding_requirements: 0,
    cross_reference: 0,
    compliance_verification: 0,
    material_selection: 0,
  };

  for (const q of queries) {
    byComplexity[q.complexity]++;
    byCategory[q.category]++;
  }

  console.log(`[Synthetic A999] Generated ${queries.length} test queries`);
  console.log(`[Synthetic A999] Complexity: Easy=${byComplexity.easy}, Medium=${byComplexity.medium}, Hard=${byComplexity.hard}`);

  return {
    document,
    queries,
    metadata: {
      totalQueries: queries.length,
      byComplexity,
      byCategory,
      criticalCategories: [
        'mechanical_properties',
        'chemical_composition',
        'heat_treatment',
        'compliance_verification',
      ],
    },
  };
}

/**
 * Export test queries as JSON for evaluation
 */
export function exportTestQueries(suite: SyntheticTestSuite): string {
  return JSON.stringify(suite.queries, null, 2);
}

/**
 * Get queries by category for targeted testing
 */
export function getQueriesByCategory(
  suite: SyntheticTestSuite,
  category: QueryCategory
): TestQuery[] {
  return suite.queries.filter(q => q.category === category);
}

/**
 * Get queries by complexity for progressive testing
 */
export function getQueriesByComplexity(
  suite: SyntheticTestSuite,
  complexity: QueryComplexity
): TestQuery[] {
  return suite.queries.filter(q => q.complexity === complexity);
}
