/**
 * DSPy-Style Query Optimization Module
 *
 * Implements programmatic prompt optimization patterns inspired by DSPy:
 * 1. Query Classification - Identify query intent (lookup, comparison, synthesis)
 * 2. Code Expansion - Expand technical codes automatically
 * 3. Few-Shot Selection - Choose relevant examples based on query type
 * 4. Response Refinement - Post-process output for quality
 *
 * These optimizations improve accuracy and reduce latency for materials engineering queries.
 */

// ============================================
// Query Classification
// ============================================

export type QueryIntent =
  | 'lookup'      // Direct value lookup (yield strength, composition)
  | 'comparison'  // Compare two or more items
  | 'synthesis'   // Combine information from multiple sources
  | 'list'        // List all items matching criteria
  | 'explanation' // Explain a concept or requirement
  | 'verification'; // Verify if something meets requirements

interface ClassificationResult {
  intent: QueryIntent;
  confidence: number;
  entities: ExtractedEntities;
}

interface ExtractedEntities {
  grades: string[];        // F51, F53, etc.
  unsNumbers: string[];    // S31803, J93183, etc.
  standards: string[];     // A1049, A872, A790
  properties: string[];    // yield strength, chromium, nitrogen
  comparators: string[];   // vs, compare, difference
}

// Classification patterns for each intent type
const INTENT_PATTERNS: Record<QueryIntent, RegExp[]> = {
  lookup: [
    /what\s+is\s+(?:the\s+)?(?:\w+\s+){0,3}(?:of|for)\s+/i,
    /(?:yield|tensile)\s+strength\s+(?:of|for)/i,
    /(?:chemical\s+)?composition\s+(?:of|for)/i,
    /\b(?:nitrogen|chromium|nickel|molybdenum)\s+(?:content|range)/i,
    /heat\s+treatment\s+(?:temperature|for)/i,
  ],
  comparison: [
    /compare\s+/i,
    /\bvs\.?\b|\bversus\b/i,
    /difference\s+(?:between|in)/i,
    /\bwhich\s+(?:is|has)\s+(?:higher|lower|better|more)/i,
    /\b(?:F\d{2}|S\d{5}|J\d{5})\s+(?:and|vs\.?|,)\s+(?:F\d{2}|S\d{5}|J\d{5})/i,
  ],
  synthesis: [
    /across\s+(?:all|multiple|different)/i,
    /\ball\s+(?:grades|standards|specifications)/i,
    /summary\s+of/i,
    /combine|combining/i,
  ],
  list: [
    /list\s+(?:all|the)/i,
    /what\s+(?:are\s+)?(?:all|the)\s+\w+\s+(?:covered|specified)/i,
    /\bwhat\s+UNS\b/i,
    /\bwhich\s+grades\b/i,
  ],
  explanation: [
    /\bwhat\s+is\s+(?:a\s+)?(?!the\s+\w+\s+of)/i, // "what is X" but not "what is the X of"
    /\bhow\s+(?:does|do|is|are)/i,
    /\bwhy\s+(?:does|do|is|are)/i,
    /explain\s+/i,
    /describe\s+/i,
  ],
  verification: [
    /does\s+(?:\w+\s+)?meet/i,
    /is\s+(?:\w+\s+)?compliant/i,
    /verify\s+/i,
    /check\s+if/i,
  ],
};

// Entity extraction patterns
const ENTITY_PATTERNS = {
  grades: /\bF\d{2,3}[A-Z]?\b/gi,
  unsNumbers: /\b(?:S|J)\d{5}\b/gi,
  standards: /\bA\d{3,4}(?:\/A\d{3,4}M)?\b/gi,
  properties: /\b(?:yield\s+strength|tensile\s+strength|elongation|hardness|nitrogen|chromium|nickel|molybdenum|carbon|manganese|phosphorus|sulfur|silicon|copper|tungsten|cobalt|PREN|heat\s+treatment)\b/gi,
  comparators: /\b(?:vs\.?|versus|compare|compared?\s+to|difference|between)\b/gi,
};

/**
 * Classify query intent and extract entities
 */
export function classifyQuery(query: string): ClassificationResult {
  const entities = extractEntities(query);

  // Score each intent
  const scores: Record<QueryIntent, number> = {
    lookup: 0,
    comparison: 0,
    synthesis: 0,
    list: 0,
    explanation: 0,
    verification: 0,
  };

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        scores[intent as QueryIntent] += 1;
      }
    }
  }

  // Boost comparison if multiple entities
  if (entities.grades.length >= 2 || entities.unsNumbers.length >= 2) {
    scores.comparison += 2;
  }

  // Boost synthesis if "across" or multiple standards
  if (entities.standards.length >= 2) {
    scores.synthesis += 1;
  }

  // Find highest scoring intent
  let maxIntent: QueryIntent = 'lookup';
  let maxScore = 0;

  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxIntent = intent as QueryIntent;
    }
  }

  // Default to lookup if no patterns match but entities exist
  if (maxScore === 0 && (entities.grades.length > 0 || entities.unsNumbers.length > 0 || entities.properties.length > 0)) {
    maxIntent = 'lookup';
    maxScore = 0.5;
  }

  const confidence = Math.min(maxScore / 3, 1); // Normalize to 0-1

  return {
    intent: maxIntent,
    confidence,
    entities,
  };
}

/**
 * Extract entities from query
 */
function extractEntities(query: string): ExtractedEntities {
  const entities: ExtractedEntities = {
    grades: [],
    unsNumbers: [],
    standards: [],
    properties: [],
    comparators: [],
  };

  for (const [key, pattern] of Object.entries(ENTITY_PATTERNS)) {
    const matches = query.match(pattern);
    if (matches) {
      entities[key as keyof ExtractedEntities] = [...new Set(matches.map(m => m.toLowerCase()))];
    }
  }

  return entities;
}

// ============================================
// Code Expansion
// ============================================

// Map common grade names to UNS numbers
const GRADE_TO_UNS: Record<string, string> = {
  'f50': 'S31200',
  'f51': 'S31803',
  'f52': 'S32950',
  'f53': 'S32750',
  'f54': 'S39274',
  'f55': 'S32760',
  'f57': 'S39277',
  'f59': 'S32520',
  'f60': 'S32205',
  'f61': 'S32550',
  '2205': 'S32205',
  '2507': 'S32750',
  '2304': 'S32304',
  '255': 'S32550',
  '329': 'S32900',
};

// Map common abbreviations to full property names
const PROPERTY_EXPANSIONS: Record<string, string[]> = {
  'ys': ['yield strength'],
  'ts': ['tensile strength'],
  'el': ['elongation'],
  'cr': ['chromium'],
  'ni': ['nickel'],
  'mo': ['molybdenum'],
  'n': ['nitrogen'],
  'c': ['carbon'],
  'mn': ['manganese'],
  'p': ['phosphorus'],
  's': ['sulfur'],
  'si': ['silicon'],
  'cu': ['copper'],
  'w': ['tungsten'],
  'co': ['cobalt'],
};

/**
 * Expand query with technical code variations
 */
export function expandQuery(query: string, entities: ExtractedEntities): string {
  let expanded = query;

  // Add UNS numbers for grades
  for (const grade of entities.grades) {
    const uns = GRADE_TO_UNS[grade.toLowerCase()];
    if (uns && !query.toLowerCase().includes(uns.toLowerCase())) {
      expanded += ` ${uns}`;
    }
  }

  // Add full property names for abbreviations
  const words = query.toLowerCase().split(/\s+/);
  for (const word of words) {
    const expansions = PROPERTY_EXPANSIONS[word];
    if (expansions) {
      for (const exp of expansions) {
        if (!expanded.toLowerCase().includes(exp)) {
          expanded += ` ${exp}`;
        }
      }
    }
  }

  return expanded;
}

// ============================================
// Few-Shot Examples
// ============================================

interface FewShotExample {
  query: string;
  response: string;
  intent: QueryIntent;
}

const FEW_SHOT_EXAMPLES: FewShotExample[] = [
  // Lookup examples
  {
    intent: 'lookup',
    query: 'What is the yield strength of grade F53?',
    response: `**Answer:** The minimum yield strength of grade F53 (UNS S32750) is 80 ksi [550 MPa] [1].

**Details:** This is per Table 3 of ASTM A1049/A1049M, which specifies tensile and hardness requirements for duplex stainless steel forgings. The maximum Brinell hardness is 310 HB [1].

**Sources:**
[1] ASTM A1049, Table 3, Page 3`,
  },
  {
    intent: 'lookup',
    query: 'Nitrogen content for S31803?',
    response: `**Answer:** The nitrogen content for UNS S31803 (Grade F51) is 0.08-0.20% [1].

**Details:** This range is specified in Table 1 (Chemical Requirements) of ASTM A1049. Nitrogen is an important alloying element in duplex stainless steels that enhances strength and corrosion resistance [1].

**Sources:**
[1] ASTM A1049, Table 1, Page 2`,
  },
  // Comparison example
  {
    intent: 'comparison',
    query: 'Compare yield strength F51 vs F53',
    response: `**Answer:** Grade F53 has a higher minimum yield strength (80 ksi [550 MPa]) compared to F51 (65 ksi [450 MPa]) [1].

**Details:**
| Grade | UNS | Yield Strength (min) |
|-------|-----|---------------------|
| F51 | S31803 | 65 ksi [450 MPa] |
| F53 | S32750 | 80 ksi [550 MPa] |

This 23% higher yield strength in F53 is due to its higher nitrogen content (0.24-0.32% vs 0.08-0.20%) [1].

**Sources:**
[1] ASTM A1049, Table 3, Page 3`,
  },
  // List example
  {
    intent: 'list',
    query: 'What UNS designations are covered by A872?',
    response: `**Answer:** ASTM A872 covers three UNS designations [1]:
- UNS J93183
- UNS J93550
- UNS J94300 (CD4MCuMN)

**Details:** These are centrifugally cast ferritic/austenitic (duplex) stainless steel grades intended for general corrosive service. Each grade has specific chemical composition and mechanical property requirements defined in Tables 1-3 [1].

**Sources:**
[1] ASTM A872, Tables 1-3, Pages 2-3`,
  },
];

/**
 * Get relevant few-shot examples for a query intent
 */
export function getFewShotExamples(intent: QueryIntent, maxExamples: number = 2): FewShotExample[] {
  const matchingExamples = FEW_SHOT_EXAMPLES.filter(ex => ex.intent === intent);

  if (matchingExamples.length > 0) {
    return matchingExamples.slice(0, maxExamples);
  }

  // Fallback to lookup examples
  return FEW_SHOT_EXAMPLES.filter(ex => ex.intent === 'lookup').slice(0, maxExamples);
}

// ============================================
// Response Refinement
// ============================================

interface RefinementResult {
  refinedResponse: string;
  citationsValid: boolean;
  unitsStandardized: boolean;
  warnings: string[];
}

/**
 * Refine LLM response for quality and consistency
 */
export function refineResponse(
  response: string,
  chunks: Array<{ content: string; page_number: number }>
): RefinementResult {
  const warnings: string[] = [];
  let refined = response;
  let citationsValid = true;
  const unitsStandardized = true;

  // Check citations exist
  const citationRefs = response.match(/\[(\d+)\]/g) || [];
  const citedNumbers = [...new Set(citationRefs.map(ref => parseInt(ref.replace(/[\[\]]/g, ''))))];

  for (const num of citedNumbers) {
    if (num > chunks.length || num < 1) {
      warnings.push(`Citation [${num}] references non-existent source`);
      citationsValid = false;
    }
  }

  // Standardize units (add SI if Imperial only, and vice versa)
  const unitPatterns = [
    { pattern: /(\d+(?:\.\d+)?)\s*ksi(?!\s*\[)/gi, replacement: (m: string, v: string) => `${v} ksi [${Math.round(parseFloat(v) * 6.895)} MPa]` },
    { pattern: /(\d+(?:\.\d+)?)\s*°F(?!\s*\[)/gi, replacement: (m: string, v: string) => `${v}°F [${Math.round((parseFloat(v) - 32) * 5/9)}°C]` },
  ];

  for (const { pattern, replacement } of unitPatterns) {
    if (pattern.test(refined)) {
      refined = refined.replace(pattern, replacement);
    }
  }

  // Check if response says it can't answer but has citations (inconsistent)
  if (response.includes("cannot answer") && citationRefs.length > 0) {
    warnings.push("Response claims inability to answer but includes citations");
  }

  return {
    refinedResponse: refined,
    citationsValid,
    unitsStandardized: true,
    warnings,
  };
}

// ============================================
// Main Optimization Pipeline
// ============================================

export interface OptimizationResult {
  optimizedQuery: string;
  classification: ClassificationResult;
  fewShotPrompt: string;
  searchConfig: {
    bm25Weight: number;
    vectorWeight: number;
    enableReranking: boolean;
  };
}

/**
 * Full query optimization pipeline
 */
export function optimizeQuery(query: string): OptimizationResult {
  // Step 1: Classify
  const classification = classifyQuery(query);

  // Step 2: Expand
  const optimizedQuery = expandQuery(query, classification.entities);

  // Step 3: Get few-shot examples
  const examples = getFewShotExamples(classification.intent);
  const fewShotPrompt = examples
    .map(ex => `Example:\nQ: ${ex.query}\nA: ${ex.response}`)
    .join('\n\n');

  // Step 4: Configure search based on intent
  let searchConfig = {
    bm25Weight: 0.5,
    vectorWeight: 0.5,
    enableReranking: false,
  };

  switch (classification.intent) {
    case 'lookup':
      // High BM25 for exact code matching
      searchConfig = { bm25Weight: 0.7, vectorWeight: 0.3, enableReranking: false };
      break;
    case 'comparison':
      // Balanced with reranking for multi-entity queries
      searchConfig = { bm25Weight: 0.5, vectorWeight: 0.5, enableReranking: true };
      break;
    case 'synthesis':
      // Higher vector for semantic understanding
      searchConfig = { bm25Weight: 0.3, vectorWeight: 0.7, enableReranking: true };
      break;
    case 'explanation':
      // Vector-heavy for conceptual queries
      searchConfig = { bm25Weight: 0.2, vectorWeight: 0.8, enableReranking: false };
      break;
    default:
      // Balanced default
      searchConfig = { bm25Weight: 0.5, vectorWeight: 0.5, enableReranking: false };
  }

  return {
    optimizedQuery,
    classification,
    fewShotPrompt,
    searchConfig,
  };
}
