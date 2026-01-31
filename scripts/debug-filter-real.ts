#!/usr/bin/env tsx
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getCachedQueryEmbedding } from "../lib/embedding-cache";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  // Get A790 document IDs
  const { data: docs } = await supabase
    .from("documents")
    .select("id, filename")
    .ilike("filename", "%A790%")
    .eq("status", "indexed");

  console.log("A790 Documents:", docs);

  if (!docs || docs.length === 0) {
    console.log("No A790 documents found!");
    return;
  }

  const a790Ids = docs.map((d) => d.id);
  console.log("A790 IDs:", a790Ids);

  // Get real embedding
  console.log("\nGenerating real embedding...");
  const embedding = await getCachedQueryEmbedding("S32205 yield strength A790");
  console.log("Embedding dimensions:", embedding.length);

  // Test hybrid search WITH filter
  console.log("\nTesting hybrid_search_chunks WITH A790 filter...");
  const { data: filteredResults, error: filterError } = await supabase.rpc(
    "hybrid_search_chunks",
    {
      query_text: "S32205 yield strength",
      query_embedding: embedding,
      match_count: 5,
      bm25_weight: 0.3,
      vector_weight: 0.7,
      filter_document_ids: a790Ids,
    }
  );

  if (filterError) {
    console.log("Filter Error:", filterError);
  } else {
    console.log("Filtered Results Count:", filteredResults?.length);
    for (const r of filteredResults || []) {
      // Lookup doc name
      const doc = docs.find(d => d.id === r.document_id);
      console.log(`  - Doc ${r.document_id} (${doc?.filename || 'unknown'}): ${r.content.slice(0, 100)}`);
    }
  }

  // Get A789 document IDs
  const { data: a789Docs } = await supabase
    .from("documents")
    .select("id, filename")
    .ilike("filename", "%A789%")
    .eq("status", "indexed");

  console.log("\nA789 Documents:", a789Docs);

  // Test WITHOUT filter to compare
  console.log("\nTesting hybrid_search_chunks WITHOUT filter...");
  const { data: unfilteredResults, error: unfilteredError } = await supabase.rpc(
    "hybrid_search_chunks",
    {
      query_text: "S32205 yield strength",
      query_embedding: embedding,
      match_count: 5,
      bm25_weight: 0.3,
      vector_weight: 0.7,
      filter_document_ids: null,
    }
  );

  if (unfilteredError) {
    console.log("Unfiltered Error:", unfilteredError);
  } else {
    console.log("Unfiltered Results Count:", unfilteredResults?.length);
    for (const r of unfilteredResults || []) {
      // Check if A789 or A790
      const isA790 = docs.some(d => d.id === r.document_id);
      const isA789 = a789Docs?.some(d => d.id === r.document_id);
      console.log(`  - Doc ${r.document_id} (A790: ${isA790}, A789: ${isA789}): ${r.content.slice(0, 100)}`);
    }
  }
}

main();
