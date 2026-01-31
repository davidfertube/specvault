/**
 * Baseline Client for Claude Opus 4.5
 *
 * Sends queries directly to Claude without document context
 * to establish a baseline for comparison with the RAG system.
 */

import Anthropic from '@anthropic-ai/sdk';

export interface BaselineResponse {
  response: string;
  latency_ms: number;
  model: string;
  success: boolean;
  error?: string;
}

export interface BaselineClientConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  timeout?: number;
}

const BASELINE_SYSTEM_PROMPT = `You are a materials engineering assistant specializing in ASTM specifications for stainless steel pipe and tubing.

Answer questions based on your training knowledge. Be specific with numerical values (yield strength, composition ranges, temperatures) when you know them.

Key specifications you should know:
- ASTM A790: Seamless and Welded Ferritic/Austenitic Stainless Steel Pipe
- ASTM A789: Seamless and Welded Ferritic/Austenitic Stainless Steel Tubing
- ASTM A312: Seamless, Welded, and Heavily Cold Worked Austenitic Stainless Steel Pipes
- ASTM A1049: Duplex Stainless Steel Forgings

If you don't know or are uncertain about a specific value, clearly state that you don't have that information rather than guessing. For example: "I don't have the specific value for..." or "I'm not certain about..."

When answering:
1. Provide specific numerical values when known (e.g., "65 ksi [450 MPa]")
2. Include units (ksi, MPa, %, °F, °C)
3. Reference the source specification when applicable
4. For comparison questions, clearly distinguish between specifications/grades`;

/**
 * Baseline client for direct Claude API calls (no RAG)
 */
export class BaselineClient {
  private client: Anthropic | null = null;
  private model: string;
  private maxTokens: number;
  private timeout: number;

  constructor(config: BaselineClientConfig = {}) {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;

    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }

    this.model = config.model || 'claude-opus-4-5-20251101';
    this.maxTokens = config.maxTokens || 1024;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Check if the baseline client is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Query Claude directly without document context
   */
  async query(prompt: string): Promise<BaselineResponse> {
    const startTime = Date.now();

    if (!this.client) {
      return {
        response: '',
        latency_ms: Date.now() - startTime,
        model: this.model,
        success: false,
        error: 'ANTHROPIC_API_KEY not configured. Set it in .env.local to enable baseline comparison.',
      };
    }

    try {
      console.log(`[Baseline] Querying ${this.model} with prompt: "${prompt.slice(0, 100)}..."`);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: BASELINE_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const latency_ms = Date.now() - startTime;

      // Debug: Log full response structure
      console.log(`[Baseline] Response received in ${latency_ms}ms, stop_reason: ${response.stop_reason}`);
      console.log(`[Baseline] Content blocks: ${response.content.length}, types: ${response.content.map(b => b.type).join(', ')}`);

      // Extract text from response
      const textContent = response.content.find(block => block.type === 'text');
      const responseText = textContent?.type === 'text' ? textContent.text : '';

      // Debug: Check if response is empty
      if (!responseText) {
        console.warn(`[Baseline] Empty response text. Full content: ${JSON.stringify(response.content)}`);
      } else {
        console.log(`[Baseline] Response text (first 200 chars): "${responseText.slice(0, 200)}..."`);
      }

      return {
        response: responseText,
        latency_ms,
        model: response.model,
        success: true,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Baseline] Error: ${errorMsg}`);

      // Log more details for debugging
      if (error instanceof Error && 'status' in error) {
        const status = (error as { status: number }).status;
        console.error(`[Baseline] HTTP Status: ${status}`);

        // Check for billing/credit errors
        if (status === 400 && errorMsg.includes('credit balance')) {
          console.warn(`[Baseline] Anthropic account has insufficient credits. Baseline comparison disabled.`);
          // Mark client as unavailable for future requests
          this.client = null;
        }
      }

      return {
        response: '',
        latency_ms: Date.now() - startTime,
        model: this.model,
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Run multiple queries in sequence with rate limiting
   */
  async queryBatch(prompts: string[], delayMs: number = 500): Promise<BaselineResponse[]> {
    const results: BaselineResponse[] = [];

    for (let i = 0; i < prompts.length; i++) {
      const result = await this.query(prompts[i]);
      results.push(result);

      // Rate limiting delay between requests
      if (i < prompts.length - 1 && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }
}

/**
 * Singleton instance for convenience
 */
let baselineClientInstance: BaselineClient | null = null;

export function getBaselineClient(config?: BaselineClientConfig): BaselineClient {
  if (!baselineClientInstance) {
    baselineClientInstance = new BaselineClient(config);
  }
  return baselineClientInstance;
}

/**
 * Quick query function for one-off baseline queries
 */
export async function queryBaseline(prompt: string): Promise<BaselineResponse> {
  const client = getBaselineClient();
  return client.query(prompt);
}
