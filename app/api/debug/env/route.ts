import { NextResponse } from "next/server";

/**
 * Debug endpoint to check environment variable availability
 * Returns presence (true/false) without revealing full values
 *
 * GET /api/debug/env
 */
export async function GET() {
  const requiredVars = [
    "VOYAGE_API_KEY",
    "GROQ_API_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];

  const optionalVars = [
    "GOOGLE_API_KEY",
    "CEREBRAS_API_KEY",
    "TOGETHER_API_KEY",
    "OPENROUTER_API_KEY",
  ];

  const status: Record<string, { present: boolean; prefix?: string }> = {};

  for (const varName of [...requiredVars, ...optionalVars]) {
    const value = process.env[varName];
    status[varName] = {
      present: !!value && value.trim().length > 0,
      prefix: value ? value.substring(0, 4) + "..." : undefined,
    };
  }

  // Check for common misspellings
  const misspellings = [
    "VOYAGE_KEY",
    "VOYAGEAI_API_KEY",
    "VOYAGEAI_KEY",
    "VOYAGE_API",
    "VOAYGE_API_KEY",
  ];
  const foundMisspellings = misspellings.filter((v) => process.env[v]);

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    required: Object.fromEntries(
      requiredVars.map((v) => [v, status[v]])
    ),
    optional: Object.fromEntries(
      optionalVars.map((v) => [v, status[v]])
    ),
    misspellings:
      foundMisspellings.length > 0 ? foundMisspellings : "None detected",
    recommendation: !status["VOYAGE_API_KEY"]?.present
      ? "VOYAGE_API_KEY is missing. Check: 1) Vercel Dashboard spelling, 2) Redeploy after adding, 3) Key should start with 'pa-'"
      : "Required variables appear to be set",
  });
}
