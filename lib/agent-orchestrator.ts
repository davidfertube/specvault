/**
 * Agent Orchestrator (LangGraph-Style State Machine)
 *
 * Implements an agentic RAG pipeline with:
 * - Intent classification
 * - Smart routing (simple vs decomposed queries)
 * - Document filtering (A789 vs A790)
 * - Response verification
 * - Retry with reformulation
 *
 * State Machine Flow:
 * START → CLASSIFY → ROUTE → SEARCH → VERIFY → END
 *                                ↓        ↓
 *                           RETRY (if confidence < 80%)
 */

import { multiQueryRAG, type MultiQueryRAGResult } from "./multi-query-rag";
import { preprocessQuery, formatExtractedCodes, type ProcessedQuery } from "./query-preprocessing";
import { resolveSpecsToDocuments } from "./document-mapper";
import { type HybridSearchResult } from "./hybrid-search";

// ============================================================================
// Types
// ============================================================================

export type AgentIntent = 'lookup' | 'compare' | 'list' | 'explain' | 'verify' | 'unknown';
export type AgentState = 'CLASSIFY' | 'ROUTE' | 'SEARCH' | 'VERIFY' | 'RETRY' | 'END';

export interface AgentContext {
  /** Original user query */
  query: string;
  /** Preprocessed query with extracted codes */
  processedQuery: ProcessedQuery | null;
  /** Detected intent */
  intent: AgentIntent;
  /** Confidence in the intent (0-1) */
  intentConfidence: number;
  /** Document IDs to filter search to */
  documentFilter: number[] | null;
  /** Retrieved chunks from search */
  chunks: HybridSearchResult[];
  /** Number of retry attempts */
  retryCount: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Errors encountered */
  errors: string[];
  /** Search metadata */
  searchMetadata: {
    totalCandidates: number;
    subqueryResults: number[];
    reranked: boolean;
    documentFilter: number[] | null;
  } | null;
  /** Current state in the state machine */
  currentState: AgentState;
  /** Response confidence after verification */
  responseConfidence: number;
}

export interface AgentResult {
  chunks: HybridSearchResult[];
  context: AgentContext;
  success: boolean;
}

// ============================================================================
// Intent Classification
// ============================================================================

const INTENT_PATTERNS: { intent: AgentIntent; patterns: RegExp[]; keywords: string[] }[] = [
  {
    intent: 'compare',
    patterns: [
      /compare|vs\.?|versus|differ|between|distinction/i,
      /A789.*A790|A790.*A789/i,  // Specific A789 vs A790 comparison
    ],
    keywords: ['compare', 'vs', 'versus', 'difference', 'between', 'distinguish'],
  },
  {
    intent: 'list',
    patterns: [
      /list|what are|which grades|enumerate|all the/i,
    ],
    keywords: ['list', 'all', 'enumerate', 'which grades', 'what grades'],
  },
  {
    intent: 'explain',
    patterns: [
      /explain|why|how does|what happens|describe|mechanism/i,
    ],
    keywords: ['explain', 'why', 'how', 'describe', 'mechanism'],
  },
  {
    intent: 'verify',
    patterns: [
      /is it true|does it meet|verify|confirm|compliant|within spec/i,
    ],
    keywords: ['verify', 'confirm', 'true', 'compliant', 'meet', 'within'],
  },
  {
    intent: 'lookup',
    patterns: [
      /what is|yield|tensile|hardness|composition|temperature|value of/i,
    ],
    keywords: ['what is', 'yield', 'tensile', 'value', 'requirement', 'per'],
  },
];

/**
 * Classify the intent of a query
 */
function classifyIntent(query: string): { intent: AgentIntent; confidence: number } {
  const lowerQuery = query.toLowerCase();

  // Score each intent
  const scores: { intent: AgentIntent; score: number }[] = [];

  for (const { intent, patterns, keywords } of INTENT_PATTERNS) {
    let score = 0;

    // Check regex patterns
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        score += 2;
      }
    }

    // Check keywords
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        score += 1;
      }
    }

    scores.push({ intent, score });
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  const topScore = scores[0];
  const secondScore = scores[1]?.score || 0;

  // Calculate confidence based on score difference
  const confidence = topScore.score > 0
    ? Math.min(0.9, 0.5 + (topScore.score - secondScore) * 0.1 + topScore.score * 0.05)
    : 0.3;

  return {
    intent: topScore.score > 0 ? topScore.intent : 'unknown',
    confidence,
  };
}

// ============================================================================
// State Machine Transitions
// ============================================================================

/**
 * CLASSIFY state: Extract codes and classify intent
 */
async function classifyState(ctx: AgentContext): Promise<AgentContext> {
  console.log(`[Agent] CLASSIFY: "${ctx.query}"`);

  // Preprocess query
  ctx.processedQuery = preprocessQuery(ctx.query);

  // Classify intent
  const { intent, confidence } = classifyIntent(ctx.query);
  ctx.intent = intent;
  ctx.intentConfidence = confidence;

  console.log(`[Agent] Intent: ${intent} (confidence: ${(confidence * 100).toFixed(0)}%)`);

  if (ctx.processedQuery.boostExactMatch) {
    console.log(`[Agent] Extracted codes: ${formatExtractedCodes(ctx.processedQuery.extractedCodes)}`);
  }

  ctx.currentState = 'ROUTE';
  return ctx;
}

/**
 * ROUTE state: Determine search strategy and document filter
 */
async function routeState(ctx: AgentContext): Promise<AgentContext> {
  console.log(`[Agent] ROUTE: strategy for intent=${ctx.intent}`);

  if (!ctx.processedQuery) {
    ctx.errors.push('No processed query available');
    ctx.currentState = 'END';
    return ctx;
  }

  // Resolve document filter from extracted ASTM codes
  ctx.documentFilter = await resolveSpecsToDocuments(ctx.processedQuery.extractedCodes);

  if (ctx.documentFilter) {
    console.log(`[Agent] Document filter: [${ctx.documentFilter.join(', ')}]`);
  } else {
    console.log(`[Agent] No document filter (searching all docs)`);
  }

  ctx.currentState = 'SEARCH';
  return ctx;
}

/**
 * SEARCH state: Execute multi-query RAG with document filter
 */
async function searchState(ctx: AgentContext): Promise<AgentContext> {
  console.log(`[Agent] SEARCH: executing multi-query RAG`);

  try {
    // Multi-query RAG now handles document filtering internally
    const ragResult: MultiQueryRAGResult = await multiQueryRAG(ctx.query, 5);

    ctx.chunks = ragResult.chunks;
    ctx.searchMetadata = ragResult.searchMetadata;

    console.log(`[Agent] Retrieved ${ctx.chunks.length} chunks from ${ragResult.searchMetadata.totalCandidates} candidates`);

    ctx.currentState = 'VERIFY';
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    ctx.errors.push(`Search failed: ${errorMsg}`);
    console.error(`[Agent] Search error: ${errorMsg}`);
    ctx.currentState = 'RETRY';
  }

  return ctx;
}

/**
 * VERIFY state: Check search quality and determine if retry needed
 */
async function verifyState(ctx: AgentContext): Promise<AgentContext> {
  console.log(`[Agent] VERIFY: checking search quality`);

  // Calculate response confidence based on search results
  let confidence = 0;

  if (ctx.chunks.length === 0) {
    confidence = 0;
    console.log(`[Agent] No chunks retrieved, confidence = 0`);
  } else {
    // Factors that increase confidence:
    // 1. Number of chunks (max 5)
    const chunkScore = Math.min(ctx.chunks.length / 5, 1) * 0.3;

    // 2. Combined score of top chunk
    const topScore = ctx.chunks[0]?.combined_score || 0;
    const relevanceScore = Math.min(topScore, 1) * 0.4;

    // 3. BM25 score (exact keyword match)
    const topBm25 = ctx.chunks[0]?.bm25_score || 0;
    const exactMatchScore = topBm25 > 0 ? 0.2 : 0;

    // 4. Document filter applied correctly
    const filterScore = ctx.documentFilter && ctx.searchMetadata?.documentFilter ? 0.1 : 0.05;

    confidence = chunkScore + relevanceScore + exactMatchScore + filterScore;
  }

  ctx.responseConfidence = confidence;
  console.log(`[Agent] Response confidence: ${(confidence * 100).toFixed(0)}%`);

  // If confidence is too low and we haven't retried too many times, retry
  if (confidence < 0.5 && ctx.retryCount < ctx.maxRetries) {
    console.log(`[Agent] Confidence below threshold, triggering retry`);
    ctx.currentState = 'RETRY';
  } else {
    ctx.currentState = 'END';
  }

  return ctx;
}

/**
 * RETRY state: Reformulate query or expand search
 */
async function retryState(ctx: AgentContext): Promise<AgentContext> {
  ctx.retryCount++;
  console.log(`[Agent] RETRY: attempt ${ctx.retryCount}/${ctx.maxRetries}`);

  if (ctx.retryCount >= ctx.maxRetries) {
    console.log(`[Agent] Max retries reached, ending`);
    ctx.currentState = 'END';
    return ctx;
  }

  // Strategy: Remove document filter to search more broadly
  if (ctx.documentFilter && ctx.retryCount === 1) {
    console.log(`[Agent] Retry strategy: removing document filter`);
    ctx.documentFilter = null;
  }

  // Go back to search
  ctx.currentState = 'SEARCH';
  return ctx;
}

// ============================================================================
// Main Orchestrator
// ============================================================================

/**
 * Run the agent orchestrator
 *
 * @param query - User query
 * @param maxRetries - Maximum retry attempts (default: 2)
 * @returns Agent result with chunks and context
 */
export async function runAgentOrchestrator(
  query: string,
  maxRetries: number = 2
): Promise<AgentResult> {
  console.log(`\n[Agent] ========== Starting Agent Orchestrator ==========`);
  console.log(`[Agent] Query: "${query}"`);

  // Initialize context
  let ctx: AgentContext = {
    query,
    processedQuery: null,
    intent: 'unknown',
    intentConfidence: 0,
    documentFilter: null,
    chunks: [],
    retryCount: 0,
    maxRetries,
    errors: [],
    searchMetadata: null,
    currentState: 'CLASSIFY',
    responseConfidence: 0,
  };

  // State machine loop
  while (ctx.currentState !== 'END') {
    switch (ctx.currentState) {
      case 'CLASSIFY':
        ctx = await classifyState(ctx);
        break;
      case 'ROUTE':
        ctx = await routeState(ctx);
        break;
      case 'SEARCH':
        ctx = await searchState(ctx);
        break;
      case 'VERIFY':
        ctx = await verifyState(ctx);
        break;
      case 'RETRY':
        ctx = await retryState(ctx);
        break;
    }
  }

  console.log(`[Agent] ========== Agent Orchestrator Complete ==========`);
  console.log(`[Agent] Final: ${ctx.chunks.length} chunks, confidence=${(ctx.responseConfidence * 100).toFixed(0)}%, retries=${ctx.retryCount}`);

  return {
    chunks: ctx.chunks,
    context: ctx,
    success: ctx.chunks.length > 0 && ctx.errors.length === 0,
  };
}

/**
 * Simple wrapper that returns just the chunks (for backwards compatibility)
 */
export async function agentSearch(query: string): Promise<HybridSearchResult[]> {
  const result = await runAgentOrchestrator(query);
  return result.chunks;
}
